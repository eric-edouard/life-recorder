import { InsetList } from "@/src/components/ui/Lists/InsetList";
import { InsetListRow } from "@/src/components/ui/Lists/InsetListRow";
import { scanDevicesService } from "@/src/services/deviceService/scanDevicesService";
import { use$ } from "@legendapp/state/react";
import React from "react";

export function ScanDevices() {
	const scanning = use$(scanDevicesService.scanning$);
	const devices = use$(scanDevicesService.devices$);

	return (
		<>
			<InsetList
				className="p-5"
				headerText="compatible devices"
				headerLoading={scanning}
				emptyStateText="No compatible devices found"
			>
				{/* <InsetListRow title="Omi Dev Kit 2" /> */}
			</InsetList>
			{devices.length > 0 && (
				<InsetList className="p-5" headerText="other devices">
					{devices.map((device) => (
						<InsetListRow key={device.id} title={device.name} />
					))}
				</InsetList>
			)}
		</>
	);
}
