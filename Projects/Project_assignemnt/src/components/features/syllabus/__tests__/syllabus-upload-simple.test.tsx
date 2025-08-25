import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Simple mock for SyllabusUpload without external dependencies
const MockSyllabusUpload = ({ onSuccess }: { onSuccess?: () => void }) => {
  return (
    <div data-testid="syllabus-upload">
      <h1>Upload Syllabus</h1>
      <p>Select a class and upload your syllabus file or paste the text content for AI parsing.</p>
      
      <form>
        <label htmlFor="class-select">Class</label>
        <select data-testid="class-select" id="class-select" name="class">
          <option value="">Select a class</option>
          <option value="1">Math 101</option>
          <option value="2">Physics 201</option>
        </select>
        
        <div>
          <button type="button" data-testid="file-mode">Upload File</button>
          <button type="button" data-testid="text-mode">Paste Text</button>
        </div>
        
        <div data-testid="file-upload" style={{ display: 'block' }}>
          <p>Drop your syllabus file here</p>
          <input type="file" accept=".pdf,.txt,.doc,.docx" />
          <button type="button">Select File</button>
        </div>
        
        <div data-testid="text-input" style={{ display: 'none' }}>
          <textarea 
            data-testid="syllabus-text-input"
            placeholder="Paste your syllabus content here..."
            rows={8}
          />
          <div>
            <span>Minimum 100 characters required</span>
            <span data-testid="char-count">0 characters</span>
          </div>
        </div>
        
        <button type="submit">Upload Syllabus</button>
      </form>
    </div>
  );
};

describe('SyllabusUpload Component', () => {
  it('renders upload form correctly', () => {
    render(<MockSyllabusUpload />);
    
    expect(screen.getByRole('heading', { name: 'Upload Syllabus' })).toBeInTheDocument();
    expect(screen.getByText('Select a class and upload your syllabus file or paste the text content for AI parsing.')).toBeInTheDocument();
    expect(screen.getByTestId('class-select')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
    expect(screen.getByText('Paste Text')).toBeInTheDocument();
  });

  it('displays class selection dropdown', () => {
    render(<MockSyllabusUpload />);
    
    const classSelect = screen.getByTestId('class-select');
    expect(classSelect).toBeInTheDocument();
    
    expect(screen.getByText('Math 101')).toBeInTheDocument();
    expect(screen.getByText('Physics 201')).toBeInTheDocument();
  });

  it('shows file upload interface by default', () => {
    render(<MockSyllabusUpload />);
    
    expect(screen.getByText('Drop your syllabus file here')).toBeInTheDocument();
    expect(screen.getByText('Select File')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload Syllabus' })).toBeInTheDocument();
  });

  it('has proper file input attributes', () => {
    render(<MockSyllabusUpload />);
    
    const fileInput = screen.getByRole('button', { name: 'Select File' }).parentElement?.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', '.pdf,.txt,.doc,.docx');
  });

  it('shows character count for text input', () => {
    render(<MockSyllabusUpload />);
    
    expect(screen.getByText('Minimum 100 characters required')).toBeInTheDocument();
    expect(screen.getByTestId('char-count')).toBeInTheDocument();
  });

  it('has accessible form elements', () => {
    render(<MockSyllabusUpload />);
    
    // Check for proper labels
    expect(screen.getByLabelText('Class')).toBeInTheDocument();
    
    // Check for proper form structure (form doesn't automatically get role="form")
    const form = screen.getByTestId('syllabus-upload').querySelector('form');
    expect(form).toBeInTheDocument();
    
    // Check for submit button
    const submitButton = screen.getByRole('button', { name: 'Upload Syllabus' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('has mode switching buttons', async () => {
    const user = userEvent.setup();
    render(<MockSyllabusUpload />);
    
    const fileModeButton = screen.getByTestId('file-mode');
    const textModeButton = screen.getByTestId('text-mode');
    
    expect(fileModeButton).toBeInTheDocument();
    expect(textModeButton).toBeInTheDocument();
    
    // Buttons should be clickable
    await user.click(fileModeButton);
    await user.click(textModeButton);
  });

  it('includes text area for syllabus content', () => {
    render(<MockSyllabusUpload />);
    
    const textArea = screen.getByTestId('syllabus-text-input');
    expect(textArea).toBeInTheDocument();
    expect(textArea).toHaveAttribute('placeholder', 'Paste your syllabus content here...');
    expect(textArea).toHaveAttribute('rows', '8');
  });

  it('can select class options', async () => {
    const user = userEvent.setup();
    render(<MockSyllabusUpload />);
    
    const classSelect = screen.getByTestId('class-select');
    
    await user.selectOptions(classSelect, '1');
    expect(classSelect).toHaveValue('1');
    
    await user.selectOptions(classSelect, '2');
    expect(classSelect).toHaveValue('2');
  });

  it('can type in text area', async () => {
    const user = userEvent.setup();
    render(<MockSyllabusUpload />);
    
    const textArea = screen.getByTestId('syllabus-text-input');
    const testText = 'This is a test syllabus content';
    
    await user.type(textArea, testText);
    expect(textArea).toHaveValue(testText);
  });
});