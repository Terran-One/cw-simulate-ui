import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../atoms/snackbarNotificationState";
import { defaults } from "../../configs/constants";
import useSimulation from "../../hooks/useSimulation";
import FileUpload from "./FileUpload";
import FileUploadPaper from "./FileUploadPaper";
import { FileUploadType } from "../../CWSimulationBridge";

interface IUploadModalProps {
  dropzoneText?: string;
  variant: "simulation" | "contract" | "schema" | "both";
  dropTitle?: string;
  codeId?: number;
  open: boolean;
  onClose(success: boolean): void;
}

export default function UploadModal(props: IUploadModalProps) {
  const { dropzoneText, variant, dropTitle, open, codeId, onClose } = props;
  const sim = useSimulation();
  const navigate = useNavigate();

  const [file, setFile] = useState<FileUploadType | undefined>();
  const setNotification = useNotification();

  const handleAdd = useCallback(async () => {
    if (!file) {
      setNotification("Internal error. Please check logs.", {
        severity: "error",
      });
      console.error("no file uploaded");
      return;
    }

    if (variant === "contract") {
      const sender = Object.keys(sim.getAccounts())[0];
      if (!sender) {
        setNotification(
          "At least one account is required to upload a contract. Please add an account.",
          { severity: "error" }
        );
        navigate("/accounts");
        return;
      }
      sim.storeCode(sender, file);
    } else if (variant === "schema" && codeId) {
      sim.storeSchema(codeId, file);
    } else if (variant === "simulation") {
      try {
        // TODO: rehydrate from JSON
        //const json = file.fileContent as any;
        sim.recreate(defaults.chains.terra);
      } catch (e: any) {
        setNotification(e.message, { severity: "error" });
        console.error(e);
      }
    }
    onClose(true);
  }, [sim, file, onClose, variant]);

  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle>{dropTitle ?? "Upload Code"}</DialogTitle>
      <DialogContent sx={{ width: "50vw", maxWidth: 600 }}>
        <FileUploadPaper sx={{ width: "100%", minHeight: 180 }}>
          <FileUpload
            dropzoneText={
              dropzoneText ?? "Upload or drop a .wasm contract binary here"
            }
            variant={variant ?? "contract"}
            onAccept={(name: string, schema: JSON, content: Buffer | JSON) => {
              setFile({ name, schema, content });
            }}
            onClear={() => {
              setFile(undefined);
            }}
          />
        </FileUploadPaper>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={handleAdd} disabled={!file} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
