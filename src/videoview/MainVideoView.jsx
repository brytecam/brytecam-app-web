import React from "react";

class MainVideoView extends React.Component {
  componentDidMount = () => {
    const { stream } = this.props;
    this.video.srcObject = stream;
  };

  componentWillUnmount = () => {
    this.video.srcObject = null;
  }

  render = () => {
    const { id, stream, vidFit } = this.props;
    const fitClass = vidFit ? "fit-vid" : ""
    return (
      <div className="w-full max-w-full flex items-center justify-center p-2 relative">
        <video
          ref={ref => {
            this.video = ref;
          }}
          id={id}
          autoPlay
          playsInline
          muted={false}
          className={"w-full rounded-lg shadow" + fitClass}
        />
        <div className="main-video-name">
          <a className="main-video-name-a">{stream.info.name}</a>
        </div>
      </div>
    );
  };
}

export default MainVideoView;
