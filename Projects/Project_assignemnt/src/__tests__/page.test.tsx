import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../app/page'

describe('Home page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Assignment Tracker')
  })

  it('renders the welcome message', () => {
    render(<Home />)
    
    const welcomeMessage = screen.getByText('Welcome to your AI-powered assignment management system')
    expect(welcomeMessage).toBeInTheDocument()
  })
})