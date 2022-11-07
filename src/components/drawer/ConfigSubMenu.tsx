import { useAtomValue } from "jotai";
import cwSimulateAppState from "../../atoms/cwSimulateAppState";
import SubMenuHeader from "./SubMenuHeader";
import { Box, Button, FormControl, FormGroup, FormHelperText, Input } from "@mui/material";

export interface IConfigSubMenuProps {
}

export default function ConfigSubMenu(props: IConfigSubMenuProps) {
  const {app} = useAtomValue(cwSimulateAppState);
  return (
    <>
      <SubMenuHeader title="Chain Configuration"/>
      {/*<Typography>*/}
      {/*  Chain Id: {app.chainId}*/}
      {/*</Typography>*/}
      {/*<Typography>*/}
      {/*  Bech32Prefix: {app.bech32Prefix}*/}
      {/*</Typography>*/}
      <Box sx={{left: 8, top: 8, position: 'relative'}}>
        <FormControl>
          <FormGroup>
            <Input id="chainId" aria-describedby="chainIdHelperText" defaultValue={app.chainId}
                   inputProps={{style: {textAlign: 'center'}}}/>
            <FormHelperText id="chainIdHelperText">Chain Id.</FormHelperText>

            <Input id="bech32Prefix" aria-describedby="bech32PrefixHelperText"
                   defaultValue={app.bech32Prefix}
                   inputProps={{style: {textAlign: 'center'}}}/>
            <FormHelperText id="bech32PrefixHelperText">Bech32 Prefix.</FormHelperText>

            <Button>Save</Button>
          </FormGroup>
        </FormControl>
      </Box>
    </>
  )
}
