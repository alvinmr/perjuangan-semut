import { Provider } from 'react-redux';
import { store } from './store/store';
import Game from './components/Game';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <Game />
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
