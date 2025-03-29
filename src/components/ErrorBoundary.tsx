import { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 20px;
  margin: 20px;
  background: #fff3f3;
  border: 2px solid #ff6b6b;
  border-radius: 8px;
  color: #c92a2a;
`;

const ErrorTitle = styled.h2`
  margin: 0 0 10px 0;
  color: #e03131;
`;

const ErrorDetails = styled.pre`
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
  font-size: 14px;
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <p>The game encountered an error and couldn't continue. Please try refreshing the page.</p>
          {this.state.error && (
            <ErrorDetails>
              {this.state.error.toString()}
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;