import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <div>
            <p className="font-semibold text-foreground">Auf dieser Seite ist ein Fehler aufgetreten.</p>
            <p className="text-sm text-muted-foreground mt-1">{this.state.error.message}</p>
          </div>
          <button
            onClick={this.handleReset}
            className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Neu laden
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
