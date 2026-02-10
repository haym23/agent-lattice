import * as Dialog from "@radix-ui/react-dialog";

interface CompilePreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	content: string;
}

/**
 * Executes compile preview dialog.
 */
export function CompilePreviewDialog({
	open,
	onOpenChange,
	content,
}: CompilePreviewDialogProps): JSX.Element {
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay
					style={{
						position: "fixed",
						inset: 0,
						backgroundColor: "rgba(15, 23, 42, 0.65)",
						zIndex: 9999,
						display: "grid",
						placeItems: "center",
					}}
				>
					<Dialog.Content
						className="token-panel"
						style={{
							width: "min(920px, 92vw)",
							maxHeight: "82vh",
							overflow: "auto",
							padding: 16,
						}}
					>
						<Dialog.Title style={{ margin: 0 }}>
							Compiled Output Preview
						</Dialog.Title>
						<pre
							style={{
								marginTop: 12,
								padding: 12,
								background: "#0f172a",
								color: "#f8fafc",
								borderRadius: 8,
								maxHeight: "65vh",
								overflow: "auto",
							}}
						>
							{content}
						</pre>
					</Dialog.Content>
				</Dialog.Overlay>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
