
import React from 'react';
import { 
  Zap, 
  Building, 
  Database, 
  TrendingUp, 
  Mail, 
  BarChart3,
  CheckCircle
} from "lucide-react";

const assistants = [
  {
    id: 'auto',
    name: 'Auto',
    icon: Zap,
  },
  {
    id: 'account_intel',
    name: 'Account Intel',
    icon: Building,
  },
  {
    id: 'crm',
    name: 'CRM',
    icon: Database,
  },
  {
    id: 'deal_insight',
    name: 'Deal Insight',
    icon: TrendingUp,
  },
  {
    id: 'comms',
    name: 'Communications',
    icon: Mail,
  },
  {
    id: 'forecast',
    name: 'Forecast',
    icon: BarChart3,
  }
];

export default function ModePicker({ selectedMode, onModeSelect }) {
  return (
    <div className="flex flex-wrap gap-3 mb-8 justify-center">
      {assistants.map((assistant) => {
        const Icon = assistant.icon;
        const isSelected = selectedMode === assistant.id;
        
        return (
          <button
            key={assistant.id}
            onClick={() => onModeSelect(assistant.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isSelected 
                ? 'bg-indigo-500 text-white' 
                : 'bg-[#1a1a1a] text-[#cccccc] hover:bg-[#2a2a2a] hover:text-white border border-[#333333]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{assistant.name}</span>
          </button>
        );
      })}
    </div>
  );
}
