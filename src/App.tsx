import { LazyMotion, MotionConfig } from "motion/react";
import { ImageEditor } from "@/components/workspace/ImageEditor";

export default function App() {
  return (
    <LazyMotion features={() => import("./motionFeatures").then(m => m.default)} strict>
      <MotionConfig reducedMotion="user">
        <ImageEditor />
      </MotionConfig>
    </LazyMotion>
  );
}
