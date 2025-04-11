import type { BleAudioCodec } from "@/src/services/OmiDeviceManager/types";
import React, { useRef, useState } from "react";
import {
	Alert,
	Linking,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import AudioStats from "@/src/components/AudioStats";
import BatteryIndicator from "@/src/components/BatteryIndicator";
import { ConnectionPill } from "@/src/components/ConnectionPill";
// Import components
import StatusBanner from "@/src/components/StatusBanner";
import TranscriptionPanel from "@/src/components/TranscriptionPanel";
import { audioDataService } from "@/src/services/AudioDataService";
import { omiDeviceManager } from "@/src/services/OmiDeviceManager/OmiDeviceManager";
import { use$ } from "@legendapp/state/react";
// @ts-expect-error
import { router } from "expo-router";

export default function Home() {
	const [codec, setCodec] = useState<BleAudioCodec | null>(null);
	const connectedDeviceId = use$(omiDeviceManager.connectedDeviceId$);
	const bluetoothState = use$(omiDeviceManager.bluetoothState$);
	const [isListeningAudio, setIsListeningAudio] = useState<boolean>(false);
	const [audioPacketsReceived, setAudioPacketsReceived] = useState<number>(0);
	const [batteryLevel, setBatteryLevel] = useState<number>(-1);
	const [enableTranscription, setEnableTranscription] =
		useState<boolean>(false);
	const [deepgramApiKey, setDeepgramApiKey] = useState<string>(
		"8054633d49b3daf20f12cc6bcbd71b2a4e2b5aa2",
	);
	const [transcription, setTranscription] = useState<string>("");
	// Audio saving statistics
	const [savedAudioCount, setSavedAudioCount] = useState<number>(0);

	// Transcription processing state
	const websocketRef = useRef<WebSocket | null>(null);
	const isTranscribing = useRef<boolean>(false);
	const audioBufferRef = useRef<Uint8Array[]>([]);
	const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	/**
	 * Initialize WebSocket transcription service with Deepgram
	 */
	const initializeWebSocketTranscription = () => {
		if (!deepgramApiKey) {
			console.error("API key is required for transcription");
			return;
		}

		try {
			// Close any existing connection
			if (websocketRef.current) {
				websocketRef.current.close();
				websocketRef.current = null;
			}

			// Clear any existing processing interval
			if (processingIntervalRef.current) {
				clearInterval(processingIntervalRef.current);
				processingIntervalRef.current = null;
			}

			// Reset audio buffer
			audioBufferRef.current = [];
			isTranscribing.current = false;

			// Create a new WebSocket connection to Deepgram with configuration in URL params
			const params = new URLSearchParams({
				sample_rate: "16000",
				encoding: "opus",
				channels: "1",
				model: "nova-3",
				language: "multi",
				smart_format: "true",
				interim_results: "false",
				punctuate: "true",
				diarize: "true",
			});

			const ws = new WebSocket(
				`wss://api.deepgram.com/v1/listen?${params.toString()}`,
				[],
				// @ts-expect-error as described in node_modules/react-native/types/modules/globals.d.ts
				{
					headers: {
						Authorization: `Token ${deepgramApiKey}`,
					},
				},
			);

			ws.onopen = () => {
				console.log("Deepgram WebSocket connection established");
				isTranscribing.current = true;

				// Start processing interval to send accumulated audio
				processingIntervalRef.current = setInterval(() => {
					if (audioBufferRef.current.length > 0 && isTranscribing.current) {
						sendAudioToWebSocket();
					}
				}, 250); // Send audio every 250ms
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					console.log("Transcript received:", data);

					// Check if we have a transcript
					if (data.channel?.alternatives?.[0]?.transcript) {
						const transcript = data.channel.alternatives[0].transcript.trim();

						// Only update UI if we have actual text
						if (transcript) {
							setTranscription((prev) => {
								// Limit to last 5 transcripts to avoid too much text
								const lines = prev ? prev.split("\n") : [];
								if (lines.length > 4) {
									lines.shift();
								}

								// Add new transcript with a timestamp
								const now = new Date();
								const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

								// Add speaker information if available
								const speakerInfo = data.channel.alternatives[0].words?.[0]
									?.speaker
									? `[Speaker ${data.channel.alternatives[0].words[0].speaker}]`
									: "";

								lines.push(`[${timestamp}] ${speakerInfo} ${transcript}`);

								return lines.join("\n");
							});
						}
					}
				} catch (error) {
					console.error("Error parsing WebSocket message:", error);
				}
			};

			ws.onerror = (error) => {
				console.error("Deepgram WebSocket error:", error);
			};

			ws.onclose = () => {
				console.log("Deepgram WebSocket connection closed");
				isTranscribing.current = false;
			};

			websocketRef.current = ws;
			console.log("Deepgram WebSocket transcription initialized");
		} catch (error) {
			console.error(
				"Error initializing Deepgram WebSocket transcription:",
				error,
			);
		}
	};

	/**
	 * Send accumulated audio buffer to Deepgram WebSocket
	 */
	const sendAudioToWebSocket = () => {
		if (
			!websocketRef.current ||
			!isTranscribing.current ||
			audioBufferRef.current.length === 0
		) {
			return;
		}

		try {
			// Send each audio chunk individually to Deepgram
			// This is more efficient for streaming audio
			for (const chunk of audioBufferRef.current) {
				if (websocketRef.current.readyState === WebSocket.OPEN) {
					websocketRef.current.send(chunk);
				}
			}

			// Clear the buffer after sending
			audioBufferRef.current = [];
		} catch (error) {
			console.error("Error sending audio to Deepgram WebSocket:", error);
		}
	};

	const startAudioListener = async () => {
		try {
			if (!connectedDeviceId || !omiDeviceManager.isConnected()) {
				Alert.alert("Not Connected", "Please connect to a device first");
				return;
			}

			// Reset state
			setAudioPacketsReceived(0);
			setSavedAudioCount(0);

			console.log("Starting audio bytes listener...");

			// Start audio collection using our service
			const success = await audioDataService.startAudioCollection(
				(packetsReceived, savedCount) => {
					// Update statistics in the UI
					setAudioPacketsReceived(packetsReceived);
					setSavedAudioCount(savedCount);
				},
			);

			if (success) {
				setIsListeningAudio(true);
			} else {
				Alert.alert("Error", "Failed to start audio listener");
			}
		} catch (error) {
			console.error("Start audio listener error:", error);
			Alert.alert("Error", `Failed to start audio listener: ${error}`);
		}
	};

	const stopAudioListener = async () => {
		try {
			// Stop audio collection using our service
			await audioDataService.stopAudioCollection();
			setIsListeningAudio(false);

			// Disable transcription
			if (enableTranscription) {
				// Close WebSocket connection
				if (websocketRef.current) {
					websocketRef.current.close();
					websocketRef.current = null;
				}

				// Clear processing interval
				if (processingIntervalRef.current) {
					clearInterval(processingIntervalRef.current);
					processingIntervalRef.current = null;
				}
			}
		} catch (error) {
			console.error("Stop audio listener error:", error);
			Alert.alert("Error", `Failed to stop audio listener: ${error}`);
		}
	};

	const getAudioCodec = async () => {
		try {
			if (!connectedDeviceId || !omiDeviceManager.isConnected()) {
				Alert.alert("Not Connected", "Please connect to a device first");
				return;
			}

			try {
				const codecValue = await omiDeviceManager.getAudioCodec();
				setCodec(codecValue);
			} catch (error) {
				console.error("Get codec error:", error);

				Alert.alert("Error", `Failed to get audio codec: ${error}`);
			}
		} catch (error) {
			console.error("Unexpected error:", error);
			Alert.alert("Error", `An unexpected error occurred: ${error}`);
		}
	};

	const getBatteryLevel = async () => {
		try {
			if (!connectedDeviceId || !omiDeviceManager.isConnected()) {
				Alert.alert("Not Connected", "Please connect to a device first");
				return;
			}

			try {
				const level = await omiDeviceManager.getBatteryLevel();
				setBatteryLevel(level);
			} catch (error) {
				console.error("Get battery level error:", error);
				Alert.alert("Error", `Failed to get battery level: ${error}`);
			}
		} catch (error) {
			console.error("Unexpected error:", error);
			Alert.alert("Error", `An unexpected error occurred: ${error}`);
		}
	};

	// Handle transcription toggling
	const handleToggleTranscription = (enabled: boolean) => {
		setEnableTranscription(enabled);

		// If disabling, close any active connections
		if (!enabled && websocketRef.current) {
			websocketRef.current.close();
			websocketRef.current = null;

			if (processingIntervalRef.current) {
				clearInterval(processingIntervalRef.current);
				processingIntervalRef.current = null;
			}
		}
	};

	// Start or stop transcription
	const handleTranscriptionControl = () => {
		if (isTranscribing.current) {
			// Stop transcription
			if (websocketRef.current) {
				websocketRef.current.close();
				websocketRef.current = null;
			}

			if (processingIntervalRef.current) {
				clearInterval(processingIntervalRef.current);
				processingIntervalRef.current = null;
			}

			// Unregister audio callback
			audioDataService.unregisterRawAudioCallback();

			isTranscribing.current = false;
		} else {
			// Start transcription
			if (!deepgramApiKey) {
				Alert.alert(
					"API Key Required",
					"Please enter your Deepgram API key to start transcription",
				);
				return;
			}

			if (!isListeningAudio) {
				Alert.alert("Audio Required", "Please start the audio listener first");
				return;
			}

			// Register for raw audio data
			audioDataService.registerRawAudioCallback((bytes) => {
				if (isTranscribing.current && bytes.length > 0) {
					audioBufferRef.current.push(new Uint8Array(bytes));
				}
			});

			initializeWebSocketTranscription();
			setTranscription(""); // Clear previous transcription
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.title}>Life Logger</Text>

				{/* Connection Pill */}
				<View style={styles.pillContainer}>
					<ConnectionPill onPress={() => router.push("/pair-device")} />
				</View>

				{/* Bluetooth Status Banner */}
				<StatusBanner
					bluetoothState={bluetoothState}
					onRequestPermission={omiDeviceManager.requestBluetoothPermission}
					onOpenSettings={() => Linking.openSettings()}
				/>

				{connectedDeviceId && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Device Functions</Text>
						<TouchableOpacity style={styles.button} onPress={getAudioCodec}>
							<Text style={styles.buttonText}>Get Audio Codec</Text>
						</TouchableOpacity>

						{codec && (
							<View style={styles.codecContainer}>
								<Text style={styles.codecTitle}>Current Audio Codec:</Text>
								<Text style={styles.codecValue}>{codec}</Text>
							</View>
						)}

						<TouchableOpacity
							style={[styles.button, { marginTop: 15 }]}
							onPress={getBatteryLevel}
						>
							<Text style={styles.buttonText}>Get Battery Level</Text>
						</TouchableOpacity>

						{/* Battery Indicator */}
						<BatteryIndicator batteryLevel={batteryLevel} />

						<View style={styles.audioControls}>
							<TouchableOpacity
								style={[
									styles.button,
									isListeningAudio ? styles.buttonWarning : null,
									{ marginTop: 15 },
								]}
								onPress={
									isListeningAudio ? stopAudioListener : startAudioListener
								}
							>
								<Text style={styles.buttonText}>
									{isListeningAudio
										? "Stop Audio Listener"
										: "Start Audio Listener"}
								</Text>
							</TouchableOpacity>

							{/* Audio Stats */}
							<AudioStats
								audioPacketsReceived={audioPacketsReceived}
								showIf={isListeningAudio}
							/>

							{/* Audio Save Stats */}
							{isListeningAudio && (
								<View style={styles.statsContainer}>
									<Text style={styles.statsText}>
										Audio chunks saved: {savedAudioCount}
									</Text>
								</View>
							)}

							{/* Transcription Panel */}
							<TranscriptionPanel
								enableTranscription={enableTranscription}
								onToggleTranscription={handleToggleTranscription}
								deepgramApiKey={deepgramApiKey}
								onApiKeyChange={setDeepgramApiKey}
								isListeningAudio={isListeningAudio}
								isTranscribing={isTranscribing.current}
								onStartTranscription={handleTranscriptionControl}
								onStopTranscription={handleTranscriptionControl}
								transcription={transcription}
							/>
						</View>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	content: {
		padding: 20,
		paddingTop: Platform.OS === "android" ? 40 : 0,
		paddingBottom: 200,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		color: "#333",
		textAlign: "center",
	},
	section: {
		marginBottom: 25,
		padding: 15,
		backgroundColor: "white",
		borderRadius: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 15,
		color: "#333",
	},
	button: {
		backgroundColor: "#007AFF",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: "center",
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	buttonWarning: {
		backgroundColor: "#FF9500",
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	codecContainer: {
		marginTop: 15,
		padding: 12,
		backgroundColor: "#f0f0f0",
		borderRadius: 8,
		alignItems: "center",
	},
	codecTitle: {
		fontSize: 14,
		fontWeight: "500",
		color: "#555",
	},
	codecValue: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#007AFF",
		marginTop: 5,
	},
	audioControls: {
		marginTop: 10,
	},
	pillContainer: {
		alignItems: "center",
		marginBottom: 10,
	},
	statsContainer: {
		marginTop: 10,
		padding: 8,
		backgroundColor: "#f8f8f8",
		borderRadius: 6,
		alignItems: "center",
	},
	statsText: {
		fontSize: 14,
		color: "#555",
		fontWeight: "500",
	},
});
