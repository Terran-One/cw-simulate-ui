import { MenuItem } from "@mui/material";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import { selectCodesMetadata } from "../../atoms/simulationMetadataState";
import ContractUploadModal from "../ContractUploadModal";
import CodeMenuItem from "./CodeMenuItem";
import T1MenuItem from "./T1MenuItem";

interface ICodesMenuItemProps {
  chainId: string;
}

export default function CodesMenuItem(props: ICodesMenuItemProps) {
  const { chainId } = props;
  const codes = useRecoilValue(selectCodesMetadata(chainId));

  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const openCloseDialog = (isOpen: boolean, close: () => void ) => {
    setOpenUploadDialog(isOpen);
    if (!isOpen) close();
  };

  return (
    <>
      <T1MenuItem
        label="Codes"
        nodeId={`${chainId}/codes`}
        options={[
          <MenuItem
            key="upload-contract"
            onClick={() => setOpenUploadDialog(true)}
          >
            Upload new contract
          </MenuItem>
        ]}
        optionsExtras={({ close }) => [
          <ContractUploadModal key={'contract-upload-modal-for-sidebar'} chainId={chainId} openUploadDialog={openUploadDialog} setOpenUploadDialog={(isOpen: boolean) => openCloseDialog(isOpen, close)} />
        ]}
      >
        {Object.values(codes).map((code) => (
          <CodeMenuItem key={code.codeId} chainId={chainId} code={code} />
        ))}
      </T1MenuItem>
    </>
  );
}
