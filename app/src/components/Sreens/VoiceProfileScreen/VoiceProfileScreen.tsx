type VoiceProfileScreenProps = {
	voiceProfileId: string;
	closeModal: () => void;
};

export const VoiceProfileScreen = ({
	voiceProfileId,
	closeModal,
}: VoiceProfileScreenProps) => {
	return null;
	// const voiceProfile = use$(() =>
	// 	userService.voiceProfiles$.get().find((v) => v.id === voiceProfileId),
	// );
	// const { data: fileUrl, isLoading } = useQuery(
	// 	trpcQuery.fileUrl.queryOptions(voiceProfile?.fileId!, {
	// 		enabled: !!voiceProfile?.fileId,
	// 	}),
	// );
	// const { date, durationSeconds } = voiceProfile?.fileId
	// 	? extractDataFromFileName(voiceProfile?.fileId)
	// 	: { date: new Date(), durationSeconds: undefined };
	// return (
	// 	<View>
	// 		{isLoading && <ActivityIndicator size="large" color="#0000ff" />}
	// 		{fileUrl && (
	// 			<AudioPlayer
	// 				title={`Voice Profile`}
	// 				fileUrl={fileUrl}
	// 				date={date}
	// 				duration={durationSeconds ?? 0}
	// 				closeModal={closeModal}
	// 			/>
	// 		)}
	// 	</View>
	// );
};
