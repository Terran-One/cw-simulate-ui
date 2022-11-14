import * as React from 'react';
import { SyntheticEvent, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { treeItemClasses, TreeItemProps } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { SvgIconProps } from '@mui/material/SvgIcon';
import { TraceLog } from "@terran-one/cw-simulate/dist/types";
import { useAtomValue, useSetAtom } from "jotai";
import {
  currentStateNumber,
  stateResponseTabState,
  traceState
} from "../../atoms/simulationPageAtoms";
import useMuiTheme from "@mui/material/styles/useTheme";

declare module 'react' {
  interface CSSProperties {
    '--tree-view-color'?: string;
    '--tree-view-bg-color'?: string;
  }
}

type StyledTreeItemProps = TreeItemProps & {
  bgColor?: string;
  color?: string;
  labelIcon: JSX.Element;
  labelInfo?: string;
  labelText: string;
};

const StyledTreeItemRoot = styled(TreeItem)(({theme}) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    borderTopRightRadius: theme.spacing(2),
    borderBottomRightRadius: theme.spacing(2),
    paddingRight: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
    '&.Mui-expanded': {
      fontWeight: theme.typography.fontWeightRegular,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: 'var(--tree-view-color)',
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      color: 'inherit',
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 0,
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(2),
    },
  },
}));

function StyledTreeItem(props: StyledTreeItemProps) {
  const {
    bgColor,
    color,
    labelIcon,
    labelInfo,
    labelText,
    ...other
  } = props;

  return (
    <StyledTreeItemRoot
      label={
        <Box sx={{display: 'flex', alignItems: 'center', p: 0.5, pr: 0}}>
          <Box sx={{p: 1}}>
            {labelIcon}
          </Box>
          <Typography variant="body2" sx={{fontWeight: 'inherit', flexGrow: 1}}>
            {labelText}
          </Typography>
        </Box>
      }
      style={{
        '--tree-view-color': color,
        '--tree-view-bg-color': bgColor,
      }}
      {...other}
    />
  );
}

type NumberIconProps = SvgIconProps & {
  number: number;
}

function NumberIcon<SvgIconComponent>({number}: NumberIconProps) {
  const theme = useMuiTheme();
  return (
    <Box sx={{
      width: 24,
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      bgcolor: theme.palette.grey[900],
    }}>
      <Typography variant="body2" sx={{color: theme.palette.common.white, fontWeight: 'bold'}}>
        {number}
      </Typography>
    </Box>
  )
}

function getTreeItemLabel(trace: TraceLog) {
  switch (trace.type) {
    case "reply":
      return `reply : ${trace.msg.id}`;
    case "instantiate":
      return "instantiate";
    case "execute":
      return Object.keys(trace.msg)[0];
    default:
      return "unknown";
  }
}

const generateRandomId = () => Math.random().toString(36).substring(2, 12);

function renderTreeItems(traces?: TraceLog[], depth: number = 0) {
  return traces?.map((trace: TraceLog, index: number) => {
    if (trace.trace?.length === 0) {
      return (
        <StyledTreeItem sx={{ml: depth * 2}}
                        nodeId={generateRandomId()}
                        labelIcon={<NumberIcon number={index + 1}/>}
                        labelText={getTreeItemLabel(trace)}/>
      )
    } else {
      return (
        <StyledTreeItem nodeId={generateRandomId()}
                        labelIcon={<NumberIcon number={index + 1}/>}
                        labelText={getTreeItemLabel(trace)}>
          {renderTreeItems(trace.trace, depth + 1)}
        </StyledTreeItem>
      )
    }
  });
}

export default function StateStepperV2() {
  const setCurrentTab = useSetAtom(stateResponseTabState)
  const traces = useAtomValue(traceState);
  const currentState = useAtomValue(currentStateNumber);
  const handleClick = (e: SyntheticEvent, nodeId: string) => {
    setCurrentTab("response");
  }

  useEffect(() => {

  }, [currentState]);

  return (
    <TreeView
      aria-label="StateStepper"
      defaultExpanded={['3']}
      defaultCollapseIcon={<ArrowDropDownIcon/>}
      defaultExpandIcon={<ArrowRightIcon/>}
      defaultEndIcon={<div style={{width: 24}}/>}
      sx={{height: 264, flexGrow: 1, maxWidth: '100%', overflowY: 'auto'}}
      onNodeSelect={handleClick}
    >
      {renderTreeItems(traces)}
    </TreeView>
  );
}