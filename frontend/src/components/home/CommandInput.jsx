import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles,
  Send,
  Building2,
  Target,
  Users,
  Package,
  UserPlus,
  ChevronRight
} from "lucide-react";
import { Command, CommandList, CommandItem, CommandEmpty, CommandGroup } from '@/components/ui/command';
import { getAccountNames, getOpportunityNames, getContactNames, getProductNames, getLeadNames } from '@/api/entities';
import { SessionStorageService } from '@/services/sessionStorageService';

const sampleQueries = {
  auto: [
    "Find all high-value deals closing this quarter and draft follow-up emails",
    "Research our top 5 prospects and create account intelligence reports",
    "Analyze pipeline health and forecast revenue for next quarter"
  ],
  account_intel: [
    "Research @Microsoft's recent earnings and competitive position",
    "Find news about @Salesforce's latest product launches and market strategy",
    "Analyze @Adobe's executive changes and their impact on our deal"
  ],
  crm: [
    "Show me all opportunities over $50k closing this quarter",
    "Update all deals in stage 4 to include next steps and close dates",
    "Find contacts at enterprise accounts who haven't been contacted in 30 days"
  ],
  deal_insight: [
    "Analyze the risk factors for the Microsoft Enterprise deal",
    "What's the win probability for deals in our pipeline over $100k?",
    "Identify deals at risk of slipping to next quarter"
  ],
  comms: [
    "Draft a follow-up email for the Salesforce renewal opportunity",
    "Create a personalized outreach sequence for enterprise prospects",
    "Write a proposal summary for the Adobe Creative Suite expansion"
  ],
  forecast: [
    "What's our pipeline coverage for Q4 against quota?",
    "Show me commit vs. best case scenarios for this quarter",
    "Analyze rep performance and identify coaching opportunities"
  ]
};

const ENTITY_TYPES = {
  accounts: {
    label: 'Accounts',
    icon: Building2,
    fetchFunction: getAccountNames
  },
  opportunities: {
    label: 'Opportunities',
    icon: Target,
    fetchFunction: getOpportunityNames
  },
  contacts: {
    label: 'Contacts',
    icon: Users,
    fetchFunction: getContactNames
  },
  products: {
    label: 'Products',
    icon: Package,
    fetchFunction: getProductNames
  },
  leads: {
    label: 'Leads',
    icon: UserPlus,
    fetchFunction: getLeadNames
  }
};

export default function CommandInput({ 
  selectedMode, 
  instruction, 
  onInstructionChange, 
  onSubmit,
  isLoading 
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState(null);
  const [entitySearch, setEntitySearch] = useState('');
  const [entityData, setEntityData] = useState({});
  const [isLoadingEntities, setIsLoadingEntities] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(-1);
  const [dataFetched, setDataFetched] = useState(false);

  const textareaRef = useRef(null);

  // Fetch all entity data on component mount
  useEffect(() => {
    const fetchAllEntityData = async () => {
      // Check if we have valid cached data first
      const cachedData = SessionStorageService.getEntityData();
      
      if (cachedData && Object.keys(cachedData).length > 0) {
        // Use cached data
        setEntityData(cachedData);
        setDataFetched(true);
        setIsLoadingEntities(false);
        console.log('Using cached entity data from session storage');
        return;
      }

      // No valid cache, fetch from API
      console.log('No cached entity data found, fetching from API...');
      setIsLoadingEntities(true);
      try {
        const results = await Promise.all([
          getAccountNames().then(data => ({ type: 'accounts', data })).catch(() => ({ type: 'accounts', data: [] })),
          getOpportunityNames().then(data => ({ type: 'opportunities', data })).catch(() => ({ type: 'opportunities', data: [] })),
          getContactNames().then(data => ({ type: 'contacts', data })).catch(() => ({ type: 'contacts', data: [] })),
          getProductNames().then(data => ({ type: 'products', data })).catch(() => ({ type: 'products', data: [] })),
          getLeadNames().then(data => ({ type: 'leads', data })).catch(() => ({ type: 'leads', data: [] }))
        ]);
        
        const newEntityData = {};
        results.forEach(({ type, data }) => {
          newEntityData[type] = data;
        });
        
        // Cache the fetched data
        SessionStorageService.setEntityData(newEntityData);
        
        setEntityData(newEntityData);
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching entity data:', error);
      } finally {
        setIsLoadingEntities(false);
      }
    };

    fetchAllEntityData();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '0px';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [instruction]);

  useEffect(() => {
    // Scroll selected item into view when navigating with keyboard
    if (showSuggestions && selectedIndex >= 0) {
      const selectedElement = document.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, showSuggestions]);

  // Reset sample selection when instruction changes
  useEffect(() => {
    if (instruction.trim()) {
      setSelectedSampleIndex(-1);
    }
  }, [instruction]);

  const handleKeyDown = (e) => {
    const showSampleQueries = !instruction.trim() && sampleQueries[selectedMode];
    
    if (showSuggestions) {
      const entityTypes = Object.entries(ENTITY_TYPES);
      const currentEntities = selectedEntityType ? (entityData[selectedEntityType] || []).filter(name => 
        name.toLowerCase().includes(entitySearch.toLowerCase())
      ) : [];
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!selectedEntityType) {
          setSelectedIndex(prev => Math.min(prev + 1, entityTypes.length - 1));
        } else {
          setSelectedIndex(prev => Math.min(prev + 1, currentEntities.length - 1));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!selectedEntityType) {
          // Select entity type
          const [entityType] = entityTypes[selectedIndex];
          handleEntityTypeSelect(entityType);
        } else if (currentEntities.length > 0) {
          // Select entity
          handleEntitySelect(currentEntities[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedEntityType) {
          setSelectedEntityType(null);
          setSelectedIndex(0);
        } else {
          setShowSuggestions(false);
        }
      } else if (e.key === 'ArrowLeft' && selectedEntityType) {
        e.preventDefault();
        setSelectedEntityType(null);
        setSelectedIndex(0);
      }
    } else if (showSampleQueries && !instruction.trim()) {
      // Handle navigation for sample queries
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const maxIndex = sampleQueries[selectedMode].length - 1;
        setSelectedSampleIndex(prev => prev === -1 ? 0 : Math.min(prev + 1, maxIndex));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSampleIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && selectedSampleIndex >= 0) {
        e.preventDefault();
        handleSampleQueryClick(sampleQueries[selectedMode][selectedSampleIndex]);
      } else if (e.key === 'Escape' && selectedSampleIndex >= 0) {
        e.preventDefault();
        setSelectedSampleIndex(-1);
      } else if (e.key === 'Enter' && !e.shiftKey && selectedSampleIndex === -1) {
        e.preventDefault();
        onSubmit('run');
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit('run');
    }
  };

  const handleInstructionChange = (value) => {
    onInstructionChange(value);
    
    const lastAtIndex = value.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Extract text after @ for filtering
      const textAfterAt = value.substring(lastAtIndex + 1);
      
      // Check if there's a space after the @ symbol (indicating a complete entity selection)
      const hasCompleteEntity = textAfterAt.includes(' ');
      
      // Only show suggestions if there's no complete entity
      if (!hasCompleteEntity) {
        // Check if we should show suggestions
        if (!showSuggestions) {
          setShowSuggestions(true);
          setSelectedEntityType(null);
          setSelectedIndex(0);
        }
        
        // Set the search text for filtering
        setEntitySearch(textAfterAt);
      } else if (showSuggestions) {
        // Complete entity found, close the suggestions
        setShowSuggestions(false);
        setSelectedEntityType(null);
        setEntitySearch('');
        setSelectedIndex(0);
      }
    } else if (showSuggestions) {
      // No @ symbol found, close the suggestions
      setShowSuggestions(false);
      setSelectedEntityType(null);
      setEntitySearch('');
      setSelectedIndex(0);
    }
  };

  const handleEntityTypeSelect = (entityType) => {
    setSelectedEntityType(entityType);
    setSelectedIndex(0); // Reset index when changing tiers
  };

  const handleEntitySelect = (entityName) => {
    const lastAtIndex = instruction.lastIndexOf('@');
    let newInstruction = instruction;
    if (lastAtIndex !== -1) {
      newInstruction = instruction.substring(0, lastAtIndex + 1) + entityName + ' ';
      onInstructionChange(newInstruction);
    }
    
    // Immediately close the dropdown and reset all state
    setShowSuggestions(false);
    setSelectedEntityType(null);
    setEntitySearch('');
    setSelectedIndex(0);
    
    // Use setTimeout to ensure the state changes are processed before focusing
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = newInstruction.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  const handleSampleQueryClick = (query) => {
    onInstructionChange(query);
  };

  const placeholderText = {
    auto: "Describe what you need help with... I'll route to the right specialist",
    account_intel: "Research @ACME Corp's recent earnings and competitive position",
    crm: "Show me all opportunities over $50k closing this quarter",
    deal_insight: "Analyze the risk factors for the Microsoft Enterprise deal",
    comms: "Draft a follow-up email for the Salesforce renewal opportunity", 
    forecast: "What's our pipeline coverage for Q4 against quota?"
  };

  const showSampleQueries = !instruction.trim() && sampleQueries[selectedMode];

  return (
    <div className="relative">
      {/* Main input container */}
      <div className={`bg-[#1a1a1a] border border-[#333333] ${showSampleQueries ? 'rounded-t-xl' : 'rounded-xl'}`}>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={instruction}
            onChange={(e) => handleInstructionChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText[selectedMode]}
            className="min-h-[2.5rem] bg-transparent border-0 rounded-none text-white placeholder-[#cccccc] focus:ring-0 focus:border-0 resize-none p-3 pr-12 text-body-large"
            disabled={isLoading}
            style={{ height: 'auto' }}
          />
          
          {/* Two-tiered dropdown for @ mentions */}
          {showSuggestions && (
            <div className="absolute z-50 w-full top-full mt-1 left-0">
              <Command className="bg-[#1a1a1a] border border-[#333333] rounded-xl shadow-lg overflow-hidden">
                {isLoadingEntities ? (
                  // Loading state
                  <div className="p-8 flex flex-col items-center justify-center text-[#cccccc]">
                    <div className="w-6 h-6 border-2 border-[#666666] border-t-[#cccccc] rounded-full animate-spin mb-3"></div>
                    <span className="text-sm">Loading entity data...</span>
                  </div>
                ) : !selectedEntityType ? (
                  // First tier: Entity type selection
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    <CommandGroup heading="Select entity type">
                      {Object.entries(ENTITY_TYPES).map(([key, config], index) => {
                        const Icon = config.icon;
                        const isSelected = index === selectedIndex;
                        return (
                          <CommandItem
                            key={key}
                            data-index={index}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEntityTypeSelect(key);
                            }}
                            className={`text-white cursor-pointer flex items-center justify-between py-3 px-4 ${
                              isSelected ? 'bg-[#2a2a2a]' : 'hover:bg-[#2a2a2a]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 text-[#cccccc]" />
                              <span>{config.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#666666]" />
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                ) : (
                  // Second tier: Entity list
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333333]">
                      <button
                        onClick={() => setSelectedEntityType(null)}
                        className="text-[#cccccc] hover:text-white transition-colors"
                      >
                        ←
                      </button>
                      <span className="text-[#cccccc] text-sm">
                        {ENTITY_TYPES[selectedEntityType].label}
                        {entitySearch && <span className="ml-2 text-xs">"{entitySearch}"</span>}
                      </span>
                    </div>
                    <CommandList className="max-h-60 overflow-y-auto">
                      <CommandEmpty>No {ENTITY_TYPES[selectedEntityType].label.toLowerCase()} found.</CommandEmpty>
                      {(entityData[selectedEntityType] || [])
                            .filter(name => name.toLowerCase().includes(entitySearch.toLowerCase()))
                            .map((name, index) => {
                              const isSelected = index === selectedIndex;
                              return (
                                <CommandItem
                                  key={name}
                                  data-index={index}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEntitySelect(name);
                                  }}
                                  className={`text-white py-2 px-4 ${
                                    isSelected ? 'bg-[#2a2a2a]' : 'hover:bg-[#2a2a2a]'
                                  }`}
                                >
                                  {name}
                                </CommandItem>
                              );
                            })
                          }
                    </CommandList>
                  </>
                )}
              </Command>
            </div>
          )}
          
          {/* 3D Send Button */}
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            <Button
              onClick={() => onSubmit('run')}
              disabled={isLoading || !instruction.trim()}
              className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 border-t border-[#333333]/50 relative overflow-hidden"
              size="icon"
              title="Send"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50"></div>
              {isLoading ? (
                <Sparkles className="w-4 h-4 animate-spin relative z-10" />
              ) : (
                <Send className="w-4 h-4 relative z-10" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sample Queries - Natural extension of input box */}
      {showSampleQueries && (
        <div className="bg-[#1a1a1a] border-l border-r border-b border-[#333333] rounded-b-xl">
          {sampleQueries[selectedMode].map((query, index) => (
            <button
              key={index}
              onClick={() => handleSampleQueryClick(query)}
              className={`w-full text-left p-4 transition-colors duration-150 text-sm ${
                index === selectedSampleIndex 
                  ? 'text-white bg-[#2a2a2a] border-l-2 border-[#cccccc]' 
                  : 'text-[#cccccc] hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              {query}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}