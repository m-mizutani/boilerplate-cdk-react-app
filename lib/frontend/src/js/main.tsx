import * as React from "react";
import * as ReactDOM from "react-dom";

interface myAppState {
  isLoaded: boolean;
  msg?: string;
  error?: any;
}

const App: React.FC = () => {
  const [state, setState] = React.useState<myAppState>({ isLoaded: false });
  const showMessage = () => {
    if (!state.isLoaded) {
      return <p>Loading</p>;
    } else if (state.msg) {
      return <p>msg: {state.msg}</p>;
    } else {
      return <p>Error: {state.error}</p>;
    }
  };

  React.useEffect(() => {
    fetch("api/v1/message")
      .then((res) => {
        return res.json();
      })
      .then(
        (result) => {
          setState({ isLoaded: true, msg: result.message });
        },
        (error) => {
          setState({ isLoaded: true, error: "error" + error });
        }
      );
  }, []);

  return (
    <div>
      <h1>Welcome to my awesome app!</h1>
      {showMessage()}
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector("#app"));
