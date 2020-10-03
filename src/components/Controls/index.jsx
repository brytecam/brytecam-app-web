import React from "react"
import { ControlButton } from "./ControlButton"
import VideoIcon from "mdi-react/VideoIcon"
import VideocamOffIcon from "mdi-react/VideocamOffIcon"
import MicrophoneIcon from "mdi-react/MicrophoneIcon"
import MicrophoneOffIcon from "mdi-react/MicrophoneOffIcon"
import PhoneHangupIcon from "mdi-react/PhoneHangupIcon"
import TelevisionIcon from "mdi-react/TelevisionIcon"
import TelevisionOffIcon from "mdi-react/TelevisionOffIcon"
import VideoCheckIcon from "mdi-react/VideoCheckIcon"

const Controls = ({
  isMuted,
  isScreenSharing,
  isCameraOn,
  isChatOpen,
  onScreenToggle,
  onMicToggle,
  onCamToggle,
  onLeave,
  onChatToggle
}) => {
  return (
    <div className="absolute w-full justify-center bottom-0 flex items-center">
      <div className="mr-1">
        <ControlButton
          icon={<VideoIcon className="text-indigo-100" />}
          activeIcon={<VideocamOffIcon className="text-red-100" />}
          label="Camera"
          isActive={!isCameraOn}
          onClick={onCamToggle}
        />
      </div>
      <div className="mx-1">
        <ControlButton
          icon={<MicrophoneIcon className="text-indigo-100" />}
          activeIcon={<MicrophoneOffIcon className="text-red-100" />}
          label="Mic"
          isActive={isMuted}
          onClick={onMicToggle}
        />
      </div>
      <div className="mx-1">
        <ControlButton
          icon={<PhoneHangupIcon className="text-red-100" />}
          activeIcon={<PhoneHangupIcon className="text-red-100" />}
          label="Leave"
          onClick={onLeave}
          isActive
        />
      </div>
      <div className="mx-1">
        <ControlButton
          icon={<TelevisionIcon className="text-indigo-100" />}
          activeIcon={<TelevisionOffIcon className="text-red-100" />}
          label="Screen"
          isActive={isScreenSharing}
          onClick={onScreenToggle}
        />
      </div>
      <div className="ml-1">
        <ControlButton
          icon={<VideoCheckIcon className="text-indigo-100" />}
          activeIcon={<VideoCheckIcon text-red-100 />}
          label="Chat"
          onClick={onChatToggle}
          isActive={isChatOpen}
        />
      </div>
    </div>
  )
}

export { Controls }
