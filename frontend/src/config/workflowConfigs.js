export const WORKFLOW_CONFIGS = {
  account_intel: {
    name: "Account Intelligence",
    estimatedDuration: "2-3 minutes",
    phases: [
      {
        id: 'initialization',
        name: 'Initialization',
        description: 'Setting up workflow',
        steps: [
          { id: 'workflow_setup', name: 'Workflow Setup', icon: 'Settings' }
        ]
      },
      {
        id: 'data_gathering',
        name: 'Data Gathering',
        description: 'Collecting information from multiple sources',
        parallel: true,
        steps: [
          { id: 'crm_retriever', name: 'CRM Data', icon: 'Database', agent: 'CRM Retriever' },
          { id: 'news_researcher', name: 'News Research', icon: 'Globe', agent: 'News Researcher' }
        ]
      },
      {
        id: 'analysis',
        name: 'Analysis',
        description: 'Analyzing collected data',
        conditional: true,
        steps: [
          { id: 'analysis_agent', name: 'Deep Analysis', icon: 'Brain', agent: 'Analysis Agent' }
        ]
      },
      {
        id: 'synthesis',
        name: 'Report Generation',
        description: 'Creating final report',
        steps: [
          { id: 'report_synthesizer', name: 'Final Report', icon: 'FileText', agent: 'Report Synthesizer' }
        ]
      }
    ]
  },
  
  sales_forecast: {
    name: "Sales Forecasting",
    estimatedDuration: "1-2 minutes",
    phases: [
      {
        id: 'data_collection',
        name: 'Historical Data',
        description: 'Gathering historical sales data',
        steps: [
          { id: 'crm_history', name: 'CRM History', icon: 'Database' },
          { id: 'pipeline_analysis', name: 'Pipeline Analysis', icon: 'TrendingUp' }
        ]
      },
      {
        id: 'prediction',
        name: 'Forecast Generation',
        description: 'Generating predictions',
        steps: [
          { id: 'ml_forecast', name: 'ML Prediction', icon: 'Activity' }
        ]
      }
    ]
  },
  
  default: {
    name: "Thinking",
    estimatedDuration: "1-2 minutes",
    phases: [
      {
        id: 'thinking',
        name: 'Thinking',
        description: 'Thinking about your request',
        steps: [
          { id: 'default_thinking', name: 'Thinking', icon: 'Zap' }
        ]
      }
    ]
  }
};

export const EMPTY_STATE_MESSAGES = {
  account_intel: {
    title: "Gathering Intelligence...",
    subtitle: "Our AI agents are working on multiple fronts",
    steps: [
      "Connecting to CRM system",
      "Searching news and web sources",
      "Analyzing data patterns",
      "Generating comprehensive insights"
    ],
    estimatedTime: "2-3 minutes"
  },
  
  sales_forecast: {
    title: "Calculating Forecast...",
    subtitle: "Analyzing your sales data",
    steps: [
      "Loading historical data",
      "Analyzing pipeline trends",
      "Running prediction models",
      "Preparing forecast report"
    ],
    estimatedTime: "1-2 minutes"
  },
  
  default: {
    title: "Thinking...",
    subtitle: "Working on your task",
    steps: [
      "Understanding your request",
      "Analyzing information",
      "Generating response"
    ],
    estimatedTime: "1-2 minutes"
  }
};

export function getWorkflowConfig(droidType) {
  return WORKFLOW_CONFIGS[droidType] || WORKFLOW_CONFIGS.default;
}

export function getEmptyStateMessage(droidType) {
  return EMPTY_STATE_MESSAGES[droidType] || EMPTY_STATE_MESSAGES.default;
}