import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DownloadIcon from "@mui/icons-material/Download";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import type { CodeInfo, Coin } from "@terran-one/cw-simulate";
import { useSetAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../atoms/snackbarNotificationState";
import { drawerSubMenuState } from "../../atoms/uiState";
import T1Container from "../grid/T1Container";
import { JsonCodeMirrorEditor } from "../JsonCodeMirrorEditor";
import UploadModal from "../upload/UploadModal";
import SubMenuHeader from "./SubMenuHeader";
import T1MenuItem from "./T1MenuItem";
import useSimulation from "../../hooks/useSimulation";
import { useAccounts, useCode, useCodes } from "../../CWSimulationBridge";
import { downloadWasm } from "../../utils/fileUtils";
import Funds from "../Funds";
import useDebounce from "../../hooks/useDebounce";
import Accounts from "../Accounts";
import { BeautifyJSON } from "../simulation/tabs/Common";
import useMuiTheme from "@mui/material/styles/useTheme";
import DialogButton from "../DialogButton";
import ConfirmDialog, { ConfirmDeleteDialog, ConfirmDialogProps } from "../dialogs/ConfirmDialog";
import T1Dialog, { T1DialogAPI } from "../dialogs/T1Dialog";

export interface IContractsSubMenuProps {}

export default function ContractsSubMenu(props: IContractsSubMenuProps) {
  const sim = useSimulation();

  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const codes = Object.entries(useCodes(sim)).filter(([, c]) => !c.hidden);

  return (
    <>
      <SubMenuHeader
        title="Contracts"
        options={[
          <MenuItem
            key="upload-contract"
            onClick={() => setOpenUploadDialog(true)}
          >
            <ListItemIcon>
              <UploadIcon />
            </ListItemIcon>
            <ListItemText>Upload new contract</ListItemText>
          </MenuItem>,
        ]}
        optionsExtras={({ close }) => (
          <>
            <UploadModal
              variant="contract"
              open={openUploadDialog}
              onClose={() => {
                setOpenUploadDialog(false);
                close();
              }}
            />
          </>
        )}
      />

      {codes.map(([codeId]) => (
        <CodeMenuItem key={codeId} codeId={parseInt(codeId)} />
      ))}
    </>
  );
}

interface ICodeMenuItemProps {
  codeId: number;
}

function CodeMenuItem({ codeId }: ICodeMenuItemProps) {
  const sim = useSimulation();
  const setNotification = useNotification();
  const code = useCode(sim, codeId)!;

  const download = useCallback(() => {
    downloadWasm(code.wasmCode, code.name ?? "<unnamed code>");
  }, [code]);
  
  const handleDelete = useCallback(() => {
    sim.hideCode(code.codeId);
    setNotification('Successfully deleted contract');
  }, [code]);

  return (
    <T1MenuItem
      label={`${code.codeId}: ${code.name}`}
      textEllipsis
      options={({ close }) => [
        <DialogButton
          key="instantiate"
          Component={MenuItem}
          DialogComponent={props => (
            <InstantiateDialog {...props} codeId={codeId} />
          )}
          onClose={() => {close()}}
        >
          <ListItemIcon>
            <RocketLaunchIcon />
          </ListItemIcon>
          <ListItemText>Instantiate</ListItemText>
        </DialogButton>,
        <MenuItem key="download" onClick={download}>
          <ListItemIcon>
            <DownloadIcon />
          </ListItemIcon>
          <ListItemText>Download Source</ListItemText>
        </MenuItem>,
        <DialogButton
          key="delete"
          Component={MenuItem}
          DialogComponent={props => (
            <ConfirmDeleteDialog
              {...props}
              noun='contract'
              onConfirm={handleDelete}
            />)
          }
          onClose={() => {
            close();
          }}
        >
          <ListItemIcon>
            <DeleteForeverIcon />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </DialogButton>,
      ]}
    />
  );
}

interface IInstantiateDialogProps {
  codeId: number;
  open?: boolean;
  onClose(): void;
}

function InstantiateDialog({
  codeId,
  ...props
}: IInstantiateDialogProps) {
  const theme = useMuiTheme();
  const sim = useSimulation();
  const navigate = useNavigate();
  const setNotification = useNotification();
  const code = useCode(sim, codeId)!;
  const accounts = useAccounts(sim);
  const defaultAccount = Object.keys(accounts)[0] || "";
  const [isJsonValid, setIsJsonValid] = useState(true);
  const setDrawerSubMenu = useSetAtom(drawerSubMenuState);

  const [funds, setFunds] = useState<Coin[]>([]);
  const [isFundsValid, setFundsValid] = useState(true);
  const [payload, setPayload] = useState("");
  const [instancelabel, setInstanceLabel] = useState<string>("");
  const [account, setAccount] = useState(defaultAccount);

  const ref = useRef<HTMLInputElement | null>();
  const placeholder = {
    count: 0,
  };

  const handleLabelChange = useDebounce(
    () => {
      const val = ref.current?.value.trim();
      setInstanceLabel(val ? val : "");
    },
    200,
    []
  );

  const handleInstantiate = async ({ close }: T1DialogAPI) => {
    const instantiateMsg =
      payload.length === 0 ? placeholder : JSON.parse(payload);

    try {
      if (!account) {
        setNotification("Please select an account", { severity: "error" });
        return;
      }

      const contract = await sim.instantiate(
        account,
        code.codeId,
        instantiateMsg,
        funds,
        instancelabel
      );
      navigate(`/instances/${contract.address}`);
      close(true);
      setDrawerSubMenu(undefined);
    }
    catch (e: any) {
      setNotification(`Unable to instantiate with error: ${e.message}`, {
        severity: "error",
      });
      console.error(e);
    }
  };
  
  const ConfirmCloseDialog = useCallback((props: ConfirmDialogProps) => (
    <ConfirmDialog
      {...props}
      message='Are you sure you want to cancel contract instantiation?'
    />
  ), []);

  return (
    <T1Dialog
      {...props}
      confirmClose
      title='Instantiate Contract'
      actions={api => (
        <>
          <Button variant="outlined" onClick={() => api.close(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!payload || !isFundsValid}
            onClick={() => handleInstantiate(api)}
          >
            Instantiate
          </Button>
        </>
      )}
      ConfirmCloseDialogComponent={ConfirmCloseDialog}
      sx={{
        '.MuiDialogTitle-root+.MuiDialogContent-root': {
          pt: 1,
        },
      }}
    >
      <DialogContent>
        <Accounts defaultAccount={defaultAccount} onChange={setAccount} />
        <Funds
          TextComponent={DialogContentText}
          onChange={setFunds}
          onValidate={setFundsValid}
          sx={{ mt: 2 }}
        />
        <TextField
          fullWidth
          inputRef={ref}
          defaultValue={instancelabel}
          onChange={handleLabelChange}
          label="Label"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      
      <DialogContent>
        <Grid
          container
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <DialogContentText>InstantiateMsg</DialogContentText>
          <Grid item>
            <BeautifyJSON
              onChange={setPayload}
              disabled={!payload.length || !isJsonValid}
              sx={{ color: theme.palette.common.black }}
            />
          </Grid>
        </Grid>
        <T1Container sx={{ width: 400, height: 220 }}>
          <JsonCodeMirrorEditor
            jsonValue={payload}
            placeholder={placeholder}
            onChange={setPayload}
            onValidate={setIsJsonValid}
          />
        </T1Container>
      </DialogContent>
    </T1Dialog>
  );
}
