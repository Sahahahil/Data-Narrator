# Data Storyteller & BI Studio

An interactive Data Storyteller & BI Studio that shifts analytics away from static dashboards towards automated, exploratory data narratives. By processing data locally via WebAssembly and using Large Language Models (LLMs) as code/UI generators, it bridges the gap between raw database tables and human decision-making—all while keeping your data completely private.

✨ Key Features

- 🔒 Privacy-First: All data processing happens in-browser - zero data leaves your machine
- 🚀 Instant Insights: No server round-trips for data processing
- 🤖 AI-Powered: Natural language to SQL and visualization generation
- 📊 Auto-Visualization: Intelligent chart selection based on data characteristics
- 📖 Automated Narratives: AI-generated explanations of insights
- 🔄 Self-Healing: Aut

# Clone the repository
git clone <repository-url>
cd data-storyteller-bi-studio

# Install dependencies
npm install

# Set up environment variables (create .env file)
echo "VITE_LLM_API_KEY=your_api_key_here" > .env
echo "VITE_LLM_ENDPOINT=https://api.example.com/v1" >> .env

▶️ Running the Application

Development Mode

# Start development server with hot reload
npm run dev
The application will be available at http://localhost:5173 (or another port if 5173 is in use).

Production Build

# Create production build
npm run build

🏗️ Project Structure

data-storyteller-bi-studio/
├── src/
│   ├── data/           # DuckDB-Wasm data layer (file handling, query execution)
│   ├── ai/             # AI orchestration layer (LLM integration, prompt building)
│   ├── ui/             # UI generation layer (component factory, config builders)
│   ├── widgets/        # Rendering components (charts, tooltips, exports)
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── tests/
│   ├── Mirror of src/ structure for unit tests
├── public/
│   └ index.html        # HTML template
├── docs/
│   └ superpowers/      # Documentation, specs, plans, and QA
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── postcss.config.js   # PostCSS configuration

🔐 Privacy & Security

- Zero Data Egress: Raw data remains exclusively in browser memory/Web Worker
- Metadata Only Transmission: Only schema information (column names, types, stats) sent to LLM
- Client-Side Processing: All SQL execution, data transformation, and rendering occurs locally
- No External Dependencies: No required backend services for core functionality
- Optional Telemetry: Anonymous usage analytics can be disabled by user

🧩 Architectural Principles

1. Modular Design: Four distinct layers with clear responsibilities:
   - Data Layer: DuckDB-Wasm management, file registration, query execution
   - AI Orchestration: LLM communication, prompt building, response parsing, self-healing SQL correction
   - UI Generation: Component factory, config building, narrative generation, loading states
   - Widget Rendering: Chart components, responsive containers, tooltips, export utilities
2. Test-Driven Development: Comprehensive unit test coverage for all components
3. Privacy-First: Built with data protection as a foundational principle
4. Extensible: Clean interfaces between layers allow for easy modification and extension

📖 Usage Guide

1. Upload Data: Drag and drop a CSV or Parquet file, or use the file picker
2. Ask Questions: Type natural language questions about your data (e.g., "Show monthly revenue by region")
3. Get Insights: Receive automatically generated SQL, visualizations, and explanatory narratives
4. Export Results: Download charts as PNG or data as CSV for sharing

🔮 Future Enhancements

- Multi-file joins for relating multiple datasets
- Saved narratives for persisting and sharing data stories
- Custom visualizations with user-defined chart templates
- Additional export formats (PDF reports, PowerPoint slides)
- Collaboration features (requires backend)
