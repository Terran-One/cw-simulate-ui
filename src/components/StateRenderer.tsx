import { Typography } from "antd";
import React from "react";
import {BeforeAfterState} from './BeforeAfterState';
import StateMemoryTab from './StateMemoryTab';
import {OutputCard} from './OutputCard';
import { IState } from "./ExecuteQuery";
interface IProps {
  isFileUploaded:boolean;
  allStates:IState[];
  currentState:number;
}
export const StateRenderer = ({
  isFileUploaded,
  allStates,
  currentState
}: IProps) => {
  const [currentTab, setCurrentTab] = React.useState("state");
  let currentObject = undefined;
  window.Console.log(currentTab)
  if (currentTab === "state") {
    window.Console.log("in state")
    const currentState = window.VM?.backend?.storage.dict['c3RhdGU='];
    currentObject  = currentState===undefined?undefined:JSON.parse(window.atob(currentState))
  return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <StateMemoryTab currentTab={currentTab} setCurrentTab={setCurrentTab}/>
       isFileUploaded && allStates && allStates.length-1>0 && allStates.length-1!==currentState?<BeforeAfterState allStates={allStates} currentState={currentState}/>:
        <OutputCard response={currentJSON} placeholder="Your state will appear here."/>
      </div>
  );
  } else if (currentTab === "memory") {
    window.Console.log("in memory")
    const currentMemory = window.VM?.backend?.memory;//.dict['c3RhdGU='];
    currentObject  = currentMemory===undefined?undefined:JSON.parse(window.atob(currentMemory))
  return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <StateMemoryTab currentTab={currentTab} setCurrentTab={setCurrentTab}/>
        <OutputCard response={currentObject} placeholder={`${currentTab} will appear here.`}/>
      </div>
  );
  }
};
