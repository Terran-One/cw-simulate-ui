import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const {persistAtom} = recoilPersist({key: "simulationState"});
const simulationState = atom({
  key: 'simulationState',
  default: {},
  effects_UNSTABLE: [persistAtom]
});

export default simulationState;
