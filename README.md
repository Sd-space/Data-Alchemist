# 🧪 Data Alchemist - AI-Powered Resource Allocation

Transform your spreadsheets into clean, validated data with AI-powered insights and business rules for optimal resource allocation.

## 🚀 Features

### Core Functionality
- **Data Ingestion**: Upload CSV/XLSX files for clients, workers, and tasks
- **Interactive Data Grids**: Edit data inline with real-time validation
- **Comprehensive Validation**: 12+ validation rules with detailed error reporting
- **Business Rules Engine**: Create and manage allocation rules
- **Prioritization System**: Set weights for different allocation criteria
- **Export Functionality**: Download cleaned data and configuration files

### AI-Powered Features
- **Natural Language Search**: Search data using plain English queries
- **AI Rule Generation**: Convert natural language to business rules
- **Intelligent Data Parsing**: AI-enhanced file parsing with header mapping
- **Data Correction Suggestions**: AI-powered recommendations for data improvements
- **Pattern Analysis**: Automatic detection of co-occurrence patterns and load distribution

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Data Processing**: XLSX, PapaParse for CSV/Excel handling
- **AI Features**: Custom AI service with natural language processing
- **Validation**: Comprehensive validation engine with 12+ rules
- **UI Components**: Custom data grids, forms, and interactive panels

## 📋 Validation Rules

The application implements comprehensive validation covering:

### Core Validations (8+ implemented)
1. **Missing Required Columns** - Ensures all required fields are present
2. **Duplicate IDs** - Checks for unique ClientID/WorkerID/TaskID
3. **Malformed Lists** - Validates JSON arrays and comma-separated values
4. **Out-of-Range Values** - Ensures PriorityLevel (1-5), Duration ≥ 1
5. **Broken JSON** - Validates AttributesJSON format
6. **Unknown References** - Checks RequestedTaskIDs exist in tasks
7. **Skill Coverage** - Ensures RequiredSkills are available in workers
8. **Concurrency Feasibility** - Validates MaxConcurrent against qualified workers

### Advanced Validations
9. **Overloaded Workers** - Checks AvailableSlots vs MaxLoadPerPhase
10. **Phase-Slot Saturation** - Validates total task durations per phase
11. **Cross-Reference Integrity** - Ensures data consistency across entities
12. **Data Quality Checks** - Identifies potential data issues and improvements

## 🎯 AI Features

### Natural Language Search
- Search across all data entities using plain English
- Example queries:
  - "clients with priority level 5"
  - "workers with programming skills"
  - "tasks with duration more than 3 phases"

### AI Rule Generation
- Convert natural language to business rules
- Example: "Tasks T1 and T2 must run together" → Co-run rule
- Automatic pattern detection and rule suggestions

### Intelligent Data Parsing
- AI-enhanced file parsing with header mapping
- Handles incorrectly named columns and rearranged data
- Provides confidence scores and suggestions

### Data Correction Suggestions
- Identifies potential data issues
- Suggests improvements and optimizations
- Provides confidence scores for recommendations

## 📊 Data Structure

### Clients
- **ClientID**: Unique identifier
- **ClientName**: Client name
- **PriorityLevel**: 1-5 priority scale
- **RequestedTaskIDs**: Comma-separated task IDs
- **GroupTag**: Client grouping (enterprise, startup, small)
- **AttributesJSON**: Additional metadata in JSON format

### Workers
- **WorkerID**: Unique identifier
- **WorkerName**: Worker name
- **Skills**: Comma-separated skill tags
- **AvailableSlots**: JSON array of available phases
- **MaxLoadPerPhase**: Maximum tasks per phase
- **WorkerGroup**: Worker grouping (senior, mid, junior)
- **QualificationLevel**: 1-5 qualification scale

### Tasks
- **TaskID**: Unique identifier
- **TaskName**: Task name
- **Category**: Task category
- **Duration**: Number of phases required
- **RequiredSkills**: Comma-separated required skills
- **PreferredPhases**: JSON array or range of preferred phases
- **MaxConcurrent**: Maximum parallel workers

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd data-alchemist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Usage

1. **Upload Data**
   - Upload CSV/XLSX files for clients, workers, and tasks
   - Use the sample data files in `sample-data/` for testing

2. **Validate Data**
   - Run validation to check for errors and warnings
   - Fix issues using the interactive data grids

3. **Create Business Rules**
   - Use the AI assistant for natural language rule creation
   - Or manually create rules using the UI

4. **Set Priorities**
   - Adjust allocation weights using the prioritization panel
   - Use preset profiles or create custom configurations

5. **Export Data**
   - Download cleaned CSV files and configuration JSON
   - Ready for the next stage of resource allocation

## 📁 Project Structure

```
data-alchemist/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── Header.tsx         # Application header
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── UploadArea.tsx     # File upload component
│   ├── DataGrid.tsx       # Interactive data grid
│   ├── ValidationPanel.tsx # Validation results
│   ├── BusinessRulesPanel.tsx # Business rules management
│   ├── PrioritizationPanel.tsx # Priority weights
│   ├── AISearchPanel.tsx  # Natural language search
│   ├── AISuggestionsPanel.tsx # AI recommendations
│   └── ExportPanel.tsx    # Data export
├── lib/                   # Core libraries
│   ├── types.ts           # TypeScript type definitions
│   ├── validation.ts      # Validation engine
│   ├── ai-service.ts      # AI features service
│   └── data-processor.ts  # Data processing utilities
├── sample-data/           # Sample data files
│   ├── clients.csv        # Sample client data
│   ├── workers.csv        # Sample worker data
│   └── tasks.csv          # Sample task data
└── README.md              # This file
```

## 🎨 UI/UX Features

### Modern Design
- Clean, intuitive interface with dark/light mode support
- Responsive design for desktop and tablet
- Smooth animations and transitions
- Accessible components with proper ARIA labels

### Interactive Elements
- Drag-and-drop file upload
- Inline data editing with validation
- Real-time search and filtering
- Interactive sliders for priority weights
- Toast notifications for user feedback

### Data Visualization
- Validation status indicators
- Progress bars for weight distribution
- Color-coded error/warning/info messages
- Interactive data grids with sorting and filtering

## 🔧 Customization

### Adding New Validation Rules
1. Extend the `ValidationEngine` class in `lib/validation.ts`
2. Add new validation methods
3. Update the validation summary interface

### Extending AI Features
1. Enhance the `AIService` class in `lib/ai-service.ts`
2. Add new natural language processing capabilities
3. Implement additional pattern recognition algorithms

### Custom Business Rules
1. Extend the `BusinessRule` interface in `lib/types.ts`
2. Add new rule types and configurations
3. Update the business rules panel component

## 🧪 Sample Data

The application includes sample data files for testing:

- **clients.csv**: 8 sample clients with various priorities and requirements
- **workers.csv**: 10 sample workers with different skills and availability
- **tasks.csv**: 10 sample tasks with varying complexity and requirements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Next.js and React
- Styled with Tailwind CSS
- Icons from Lucide React
- Data processing with XLSX and PapaParse

---

**Data Alchemist** - Transforming spreadsheet chaos into organized, validated, AI-powered resource allocation data. 