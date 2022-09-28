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
      >
        {Object.values(codes).map((code) => (
          <CodeMenuItem key={code.codeId} chainId={chainId} code={code} />
        ))}
      </T1MenuItem>

      <ContractUploadModal chainId={chainId} openUploadDialog={openUploadDialog} setOpenUploadDialog={setOpenUploadDialog} />
    </>
  );
}
