import type { BleAudioCodec } from "@/src/services/OmiConnection/types";
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
import type { Subscription } from "react-native-ble-plx";

import AudioStats from "@/src/components/AudioStats";
import BatteryIndicator from "@/src/components/BatteryIndicator";
import DeviceList from "@/src/components/DeviceList";
// Import components
import StatusBanner from "@/src/components/StatusBanner";
import TranscriptionPanel from "@/src/components/TranscriptionPanel";
import { deviceConnectionManager } from "@/src/services/DeviceConnectionManager";
import { use$ } from "@legendapp/state/react";

// Target device ID to auto-connect
const TARGET_DEVICE_ID = "D65CD59F-3E9A-4BF0-016E-141BB478E1B8";

export default function Home() {
	const [codec, setCodec] = useState<BleAudioCodec | null>(null);
	const connected = use$(deviceConnectionManager.connected$);
	const devices = use$(deviceConnectionManager.devices$);
	const scanning = use$(deviceConnectionManager.scanning$);
	const bluetoothState = use$(deviceConnectionManager.bluetoothState$);
	const permissionGranted = use$(deviceConnectionManager.permissionGranted$);
	const [isListeningAudio, setIsListeningAudio] = useState<boolean>(false);
	const [audioPacketsReceived, setAudioPacketsReceived] = useState<number>(0);
	const [batteryLevel, setBatteryLevel] = useState<number>(-1);
	const [enableTranscription, setEnableTranscription] =
		useState<boolean>(false);
	const [deepgramApiKey, setDeepgramApiKey] = useState<string>(
		"8054633d49b3daf20f12cc6bcbd71b2a4e2b5aa2",
	);
	const [transcription, setTranscription] = useState<string>("");

	// Transcription processing state
	const websocketRef = useRef<WebSocket | null>(null);
	const isTranscribing = useRef<boolean>(false);
	const audioBufferRef = useRef<Uint8Array[]>([]);
	const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const audioSubscriptionRef = useRef<Subscription | null>(null);

	const startAudioListener = async () => {
		try {
			if (!connected || !deviceConnectionManager.omiConnection.isConnected()) {
				Alert.alert("Not Connected", "Please connect to a device first");
				return;
			}

			// Reset counter
			setAudioPacketsReceived(0);

			console.log("Starting audio bytes listener...");

			// Use a counter and timer to batch UI updates
			let packetCounter = 0;
			const updateInterval = setInterval(() => {
				if (packetCounter > 0) {
					setAudioPacketsReceived((prev) => prev + packetCounter);
					packetCounter = 0;
				}
			}, 500); // Update UI every 500ms

			const subscription =
				await deviceConnectionManager.omiConnection.startAudioBytesListener(
					(bytes) => {
						// Increment local counter instead of updating state directly
						packetCounter++;

						// If transcription is enabled and active, add to buffer for WebSocket
						if (bytes.length > 0 && isTranscribing.current) {
							audioBufferRef.current.push(new Uint8Array(bytes));
						}
					},
				);

			// Store interval reference for cleanup
			updateIntervalRef.current = updateInterval;

			if (subscription) {
				audioSubscriptionRef.current = subscription;
				updateIntervalRef.current = updateInterval;
				setIsListeningAudio(true);

				// If transcription was active, stop it when audio listener stops
				if (isTranscribing.current) {
					if (websocketRef.current) {
						websocketRef.current.close();
						websocketRef.current = null;
					}

					if (processingIntervalRef.current) {
						clearInterval(processingIntervalRef.current);
						processingIntervalRef.current = null;
					}

					isTranscribing.current = false;
				}
			} else {
				Alert.alert("Error", "Failed to start audio listener");
			}
		} catch (error) {
			console.error("Start audio listener error:", error);
			Alert.alert("Error", `Failed to start audio listener: ${error}`);
		}
	};

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

	// Store the update interval reference
	const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const stopAudioListener = async () => {
		try {
			// Clear the UI update interval
			if (updateIntervalRef.current) {
				clearInterval(updateIntervalRef.current);
				updateIntervalRef.current = null;
			}

			if (audioSubscriptionRef.current) {
				await deviceConnectionManager.omiConnection.stopAudioBytesListener(
					audioSubscriptionRef.current,
				);
				audioSubscriptionRef.current = null;
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
			}
		} catch (error) {
			console.error("Stop audio listener error:", error);
			Alert.alert("Error", `Failed to stop audio listener: ${error}`);
		}
	};

	const getAudioCodec = async () => {
		try {
			if (!connected || !deviceConnectionManager.omiConnection.isConnected()) {
				Alert.alert("Not Connected", "Please connect to a device first");
				return;
			}

			try {
				const codecValue =
					await deviceConnectionManager.omiConnection.getAudioCodec();
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
			if (!connected || !deviceConnectionManager.omiConnection.isConnected()) {
				Alert.alert("Not Connected", "Please connect to a device first");
				return;
			}

			try {
				const level =
					await deviceConnectionManager.omiConnection.getBatteryLevel();
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

			initializeWebSocketTranscription();
			setTranscription(""); // Clear previous transcription
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.title}>Life Logger</Text>

				{/* Bluetooth Status Banner */}
				<StatusBanner
					bluetoothState={bluetoothState}
					onRequestPermission={
						deviceConnectionManager.requestBluetoothPermission
					}
					onOpenSettings={() => Linking.openSettings()}
				/>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Bluetooth Connection</Text>
					<TouchableOpacity
						style={[styles.button, scanning ? styles.buttonWarning : null]}
						onPress={
							scanning
								? deviceConnectionManager.stopScan
								: deviceConnectionManager.startScan
						}
					>
						<Text style={styles.buttonText}>
							{scanning ? "Stop Scan" : "Scan for Devices"}
						</Text>
					</TouchableOpacity>
				</View>

				{/* Device List */}
				{devices.length > 0 && (
					<DeviceList
						devices={devices}
						connected={connected}
						connectedDeviceId={
							deviceConnectionManager.omiConnection.connectedDeviceId
						}
						onConnect={deviceConnectionManager.connectToDevice}
						onDisconnect={deviceConnectionManager.disconnectFromDevice}
					/>
				)}

				{connected && (
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
});
