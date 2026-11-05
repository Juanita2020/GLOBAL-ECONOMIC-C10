import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  RefreshCw,
  Award,
  Layers,
  GitMerge,
  Info,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Settings,
  Zap,
  ArrowRight,
  FileSpreadsheet,
  PieChart,
  Grid
} from 'lucide-react';

// --- Preloaded Decision Examples ---
const PRELOADED_EXAMPLES = {
  plantExpansion: {
    title: "Plant Expansion Decision",
    objective: "maximize",
    states: [
      { id: "s1", name: "High Demand", prob: 0.3 },
      { id: "s2", name: "Medium Demand", prob: 0.5 },
      { id: "s3", name: "Low Demand", prob: 0.2 },
    ],
    alternatives: [
      { id: "a1", name: "Build Large Facility" },
      { id: "a2", name: "Build Small Facility" },
      { id: "a3", name: "Expand Existing Plant" },
      { id: "a4", name: "Do Nothing / Subcontract" },
    ],
    payoffs: {
      a1: { s1: 250, s2: 130, s3: -90 },
      a2: { s1: 150, s2: 100, s3: -20 },
      a3: { s1: 180, s2: 110, s3: -40 },
      a4: { s1: 70,  s2: 60,  s3: 20 },
    }
  },
  productLaunch: {
    title: "New Product Launch Strategy",
    objective: "maximize",
    states: [
      { id: "s1", name: "Economic Boom", prob: 0.25 },
      { id: "s2", name: "Normal Economy", prob: 0.55 },
      { id: "s3", name: "Recession", prob: 0.20 },
    ],
    alternatives: [
      { id: "a1", name: "Aggressive Global Launch" },
      { id: "a2", name: "Targeted Regional Rollout" },
      { id: "a3", name: "Niche Digital-Only Soft Launch" },
    ],
    payoffs: {
      a1: { s1: 500, s2: 180, s3: -220 },
      a2: { s1: 300, s2: 150, s3: -50 },
      a3: { s1: 120, s2: 90,  s3: 10 },
    }
  },
  costMinimization: {
    title: "IT Infrastructure Upgrade (Cost Min)",
    objective: "minimize",
    states: [
      { id: "s1", name: "Low Traffic", prob: 0.4 },
      { id: "s2", name: "Moderate Surge", prob: 0.4 },
      { id: "s3", name: "Extreme Spike", prob: 0.2 },
    ],
    alternatives: [
      { id: "a1", name: "Legacy On-Premise Server" },
      { id: "a2", name: "Hybrid Cloud Managed" },
      { id: "a3", name: "Serverless Autoscaling" },
    ],
    payoffs: {
      a1: { s1: 40, s2: 85,  s3: 210 },
      a2: { s1: 60, s2: 75,  s3: 110 },
      a3: { s1: 75, s2: 80,  s3: 95 },
    }
  }
};

export default function App() {
  // --- Core State ---
  const [objective, setObjective] = useState("maximize"); // 'maximize' | 'minimize'
  const [states, setStates] = useState(PRELOADED_EXAMPLES.plantExpansion.states);
  const [alternatives, setAlternatives] = useState(PRELOADED_EXAMPLES.plantExpansion.alternatives);
  const [payoffs, setPayoffs] = useState(PRELOADED_EXAMPLES.plantExpansion.payoffs);
  const [activeTab, setActiveTab] = useState("matrix"); // 'matrix' | 'analysis' | 'filtering' | 'diagram'
  const [selectedExample, setSelectedExample] = useState("plantExpansion");

  // --- Staged Filtering Configuration ---
  const [filteringConfig, setFilteringConfig] = useState([
    { id: "f1", criterion: "minimaxRegret", thresholdType: "topN", thresholdValue: 3 },
    { id: "f2", criterion: "maximin", thresholdType: "topN", thresholdValue: 2 },
    { id: "f3", criterion: "emv", thresholdType: "best", thresholdValue: 1 },
  ]);

  // --- Load Preset Examples ---
  const handleLoadExample = (key) => {
    setSelectedExample(key);
    const ex = PRELOADED_EXAMPLES[key];
    if (ex) {
      setObjective(ex.objective);
      setStates(ex.states);
      setAlternatives(ex.alternatives);
      setPayoffs(ex.payoffs);
    }
  };

  // --- Matrix Editing Handlers ---
  const handleAddState = () => {
    const newId = `s_${Date.now()}`;
    const newProb = 0;
    setStates([...states, { id: newId, name: `State ${states.length + 1}`, prob: newProb }]);
    // add default 0 for new state in all alternatives
    const updatedPayoffs = { ...payoffs };
    alternatives.forEach(alt => {
      if (!updatedPayoffs[alt.id]) updatedPayoffs[alt.id] = {};
      updatedPayoffs[alt.id][newId] = 0;
    });
    setPayoffs(updatedPayoffs);
  };

  const handleRemoveState = (id) => {
    if (states.length <= 1) return;
    setStates(states.filter(s => s.id !== id));
    const updatedPayoffs = { ...payoffs };
    Object.keys(updatedPayoffs).forEach(altId => {
      delete updatedPayoffs[altId][id];
    });
    setPayoffs(updatedPayoffs);
  };

  const handleStateChange = (id, field, value) => {
    setStates(states.map(s => {
      if (s.id === id) {
        return { ...s, [field]: field === 'prob' ? Math.max(0, parseFloat(value) || 0) : value };
      }
      return s;
    }));
  };

  const handleAddAlternative = () => {
    const newId = `a_${Date.now()}`;
    const newAlt = { id: newId, name: `Alternative ${alternatives.length + 1}` };
    setAlternatives([...alternatives, newAlt]);
    const updatedPayoffs = { ...payoffs, [newId]: {} };
    states.forEach(s => {
      updatedPayoffs[newId][s.id] = 0;
    });
    setPayoffs(updatedPayoffs);
  };

  const handleRemoveAlternative = (id) => {
    if (alternatives.length <= 1) return;
    setAlternatives(alternatives.filter(a => a.id !== id));
    const updatedPayoffs = { ...payoffs };
    delete updatedPayoffs[id];
    setPayoffs(updatedPayoffs);
  };

  const handleAlternativeNameChange = (id, name) => {
    setAlternatives(alternatives.map(a => a.id === id ? { ...a, name } : a));
  };

  const handlePayoffChange = (altId, stateId, val) => {
    const num = parseFloat(val);
    setPayoffs({
      ...payoffs,
      [altId]: {
        ...(payoffs[altId] || {}),
        [stateId]: isNaN(num) ? 0 : num
      }
    });
  };

  const normalizeProbabilities = () => {
    const total = states.reduce((sum, s) => sum + (s.prob || 0), 0);
    if (total === 0) {
      const equal = Number((1 / states.length).toFixed(4));
      setStates(states.map(s => ({ ...s, prob: equal })));
      return;
    }
    setStates(states.map(s => ({
      ...s,
      prob: Number(((s.prob || 0) / total).toFixed(4))
    })));
  };

  // Total Probability validation
  const probSum = useMemo(() => {
    return states.reduce((sum, s) => sum + (Number(s.prob) || 0), 0);
  }, [states]);

  const isProbValid = Math.abs(probSum - 1.0) < 0.001;

  // --- Calculations Engine ---
  const analysisResults = useMemo(() => {
    if (!alternatives.length || !states.length) return null;

    // 1. Payoff Extrema per alternative
    const altStats = alternatives.map(alt => {
      const altPayoffs = states.map(s => payoffs[alt.id]?.[s.id] ?? 0);
      const maxVal = Math.max(...altPayoffs);
      const minVal = Math.min(...altPayoffs);

      // EMV
      const emv = states.reduce((acc, s, idx) => {
        return acc + (payoffs[alt.id]?.[s.id] ?? 0) * (s.prob || 0);
      }, 0);

      return {
        id: alt.id,
        name: alt.name,
        payoffs: altPayoffs,
        maxVal,
        minVal,
        optimisticVal: objective === 'maximize' ? maxVal : minVal,
        pessimisticVal: objective === 'maximize' ? minVal : maxVal,
        emv
      };
    });

    // 2. Maximax & Maximin (taking objective into account)
    // For MAXIMIZE: Optimistic = Max, Pessimistic = Min
    // For MINIMIZE: Optimistic = Min (lowest cost best), Pessimistic = Max (worst cost)
    
    // Maximax (Optimistic criterion)
    let bestOptimisticVal = objective === 'maximize'
      ? Math.max(...altStats.map(a => a.optimisticVal))
      : Math.min(...altStats.map(a => a.optimisticVal));
    const maximaxWinners = altStats.filter(a => Math.abs(a.optimisticVal - bestOptimisticVal) < 1e-6);

    // Maximin (Pessimistic criterion)
    let bestPessimisticVal = objective === 'maximize'
      ? Math.max(...altStats.map(a => a.pessimisticVal))
      : Math.min(...altStats.map(a => a.pessimisticVal));
    const maximinWinners = altStats.filter(a => Math.abs(a.pessimisticVal - bestPessimisticVal) < 1e-6);

    // 3. Regret Matrix & Minimax Regret
    // Ideal payoff for each state
    const stateBestPayoffs = states.map(s => {
      const vals = alternatives.map(alt => payoffs[alt.id]?.[s.id] ?? 0);
      return objective === 'maximize' ? Math.max(...vals) : Math.min(...vals);
    });

    const regretMatrix = {};
    const regretStats = alternatives.map(alt => {
      const regrets = states.map((s, idx) => {
        const best = stateBestPayoffs[idx];
        const actual = payoffs[alt.id]?.[s.id] ?? 0;
        return objective === 'maximize' ? best - actual : actual - best;
      });
      const maxRegret = Math.max(...regrets);
      regretMatrix[alt.id] = regrets;
      return {
        id: alt.id,
        name: alt.name,
        regrets,
        maxRegret
      };
    });

    const minMaxRegretVal = Math.min(...regretStats.map(r => r.maxRegret));
    const minimaxRegretWinners = regretStats.filter(r => Math.abs(r.maxRegret - minMaxRegretVal) < 1e-6);

    // 4. Expected Monetary Value (EMV / Bayes)
    const bestEMVVal = objective === 'maximize'
      ? Math.max(...altStats.map(a => a.emv))
      : Math.min(...altStats.map(a => a.emv));
    const emvWinners = altStats.filter(a => Math.abs(a.emv - bestEMVVal) < 1e-6);

    // 5. EVPI (Expected Value of Perfect Information)
    // Expected Value Under Certainty (EVUC)
    const evuc = states.reduce((acc, s, idx) => {
      return acc + stateBestPayoffs[idx] * (s.prob || 0);
    }, 0);
    const evpi = objective === 'maximize' ? evuc - bestEMVVal : bestEMVVal - evuc;

    return {
      altStats,
      bestOptimisticVal,
      maximaxWinners,
      bestPessimisticVal,
      maximinWinners,
      stateBestPayoffs,
      regretMatrix,
      regretStats,
      minMaxRegretVal,
      minimaxRegretWinners,
      bestEMVVal,
      emvWinners,
      evuc,
      evpi
    };
  }, [alternatives, states, payoffs, objective]);

  // --- Staged Filtering Engine ---
  const stagedFilteringResults = useMemo(() => {
    if (!analysisResults) return [];

    let currentCandidateIds = alternatives.map(a => a.id);
    const stagesLog = [];

    filteringConfig.forEach((stage, index) => {
      const candidates = alternatives.filter(a => currentCandidateIds.includes(a.id));

      if (candidates.length === 0) {
        stagesLog.push({
          stageIndex: index + 1,
          config: stage,
          passed: [],
          eliminated: [],
          note: "No candidates remaining from previous stage"
        });
        return;
      }

      // Rank remaining candidates based on stage criterion
      let scored = candidates.map(alt => {
        const stat = analysisResults.altStats.find(a => a.id === alt.id);
        const regretStat = analysisResults.regretStats.find(r => r.id === alt.id);

        let score = 0;
        if (stage.criterion === 'maximax') score = stat.optimisticVal;
        else if (stage.criterion === 'maximin') score = stat.pessimisticVal;
        else if (stage.criterion === 'minimaxRegret') score = regretStat.maxRegret;
        else if (stage.criterion === 'emv') score = stat.emv;

        return { ...alt, score, stat, regretStat };
      });

      // Sort scored array (Higher is better for maximax, maximin, emv if maximize; for regret smaller is better)
      scored.sort((a, b) => {
        if (stage.criterion === 'minimaxRegret') {
          return a.score - b.score; // lower regret is better always
        }
        if (objective === 'maximize') {
          return b.score - a.score; // higher pay is better
        } else {
          // minimize objective
          if (stage.criterion === 'emv' || stage.criterion === 'maximax' || stage.criterion === 'maximin') {
            return a.score - b.score; // lower cost is better
          }
          return b.score - a.score;
        }
      });

      // Apply threshold filtering
      let passedIds = [];
      if (stage.thresholdType === 'best') {
        const bestScore = scored[0].score;
        passedIds = scored.filter(s => Math.abs(s.score - bestScore) < 1e-6).map(s => s.id);
      } else if (stage.thresholdType === 'topN') {
        const limit = Math.min(stage.thresholdValue || 1, scored.length);
        passedIds = scored.slice(0, limit).map(s => s.id);
      } else if (stage.thresholdType === 'scoreLimit') {
        const val = parseFloat(stage.thresholdValue) || 0;
        passedIds = scored.filter(s => {
          if (stage.criterion === 'minimaxRegret') return s.score <= val;
          return objective === 'maximize' ? s.score >= val : s.score <= val;
        }).map(s => s.id);
      }

      // Safeguard: if stage eliminates all, keep at least top 1 to prevent empty output if configured
      if (passedIds.length === 0 && scored.length > 0) {
        passedIds = [scored[0].id];
      }

      const passed = candidates.filter(c => passedIds.includes(c.id));
      const eliminated = candidates.filter(c => !passedIds.includes(c.id));

      stagesLog.push({
        stageIndex: index + 1,
        config: stage,
        inputCandidates: candidates,
        passed,
        eliminated,
        scoredDetails: scored
      });

      currentCandidateIds = passedIds;
    });

    return stagesLog;
  }, [alternatives, analysisResults, filteringConfig, objective]);

  const updateStageConfig = (id, key, val) => {
    setFilteringConfig(filteringConfig.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const addFilterStage = () => {
    setFilteringConfig([
      ...filteringConfig,
      { id: `f_${Date.now()}`, criterion: "emv", thresholdType: "topN", thresholdValue: 2 }
    ]);
  };

  const removeFilterStage = (id) => {
    if (filteringConfig.length <= 1) return;
    setFilteringConfig(filteringConfig.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* --- HEADER --- */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                <Grid className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
                  Decision Analysis Dashboard
                </h1>
                <p className="text-xs text-slate-400">Under Uncertainty • C10 Reference Framework</p>
              </div>
            </div>

            {/* AI Development Badge / Hyperlink */}
            <div className="flex items-center space-x-4">
              <a
                href="https://chat.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-xs text-indigo-300 hover:text-white border border-indigo-500/30 transition-all duration-200 shadow-sm"
                title="View AI Development Conversation Record"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="font-medium">AI Dev Record</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* --- SUB-HEADER / CONTROLS & EXAMPLES --- */}
      <section className="bg-slate-800/50 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Preset Example Picker */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" /> Presets:
            </span>
            <select
              value={selectedExample}
              onChange={(e) => handleLoadExample(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="plantExpansion">Plant Expansion (Profit Max)</option>
              <option value="productLaunch">New Product Launch (Strategy)</option>
              <option value="costMinimization">IT Infrastructure (Cost Min)</option>
            </select>
          </div>

          {/* Objective Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 px-2 font-medium">Objective:</span>
            <button
              onClick={() => setObjective('maximize')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                objective === 'maximize'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Maximize Profit</span>
            </button>
            <button
              onClick={() => setObjective('minimize')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                objective === 'minimize'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Minimize Cost</span>
            </button>
          </div>

          {/* Probability Status indicator */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Prob Sum:</span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              isProbValid
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}>
              {probSum.toFixed(3)}
            </span>
            {!isProbValid && (
              <button
                onClick={normalizeProbabilities}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Auto-Normalize
              </button>
            )}
          </div>
        </div>
      </section>

      {/* --- NAVIGATION TABS --- */}
      <nav className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1">
          {[
            { id: "matrix", label: "1. Data Matrix", icon: Grid },
            { id: "analysis", label: "2. Criteria Engine", icon: BarChart3 },
            { id: "filtering", label: "3. Staged Pipeline", icon: Layers },
            { id: "diagram", label: "4. Decision Flowchart", icon: GitMerge },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* TAB 1: DATA MATRIX & PAYOFF EDITOR */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                    Payoff Matrix & State Probabilities
                  </h2>
                  <p className="text-xs text-slate-400">
                    Edit alternative names, states of nature, probability distributions, and payoff amounts.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAddAlternative}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Alternative</span>
                  </button>
                  <button
                    onClick={handleAddState}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add State</span>
                  </button>
                </div>
              </div>

              {/* Editable Matrix Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="p-3 border-b border-slate-700 min-w-[180px]">Alternatives \ States</th>
                      {states.map((s, idx) => (
                        <th key={s.id} className="p-3 border-b border-slate-700 border-l border-slate-800 text-center min-w-[150px]">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <input
                              type="text"
                              value={s.name}
                              onChange={(e) => handleStateChange(s.id, 'name', e.target.value)}
                              className="bg-slate-800 text-slate-100 font-semibold text-center border border-slate-700 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:border-indigo-500"
                            />
                            {states.length > 1 && (
                              <button
                                onClick={() => handleRemoveState(s.id)}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                                title="Remove State"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
                            <span>P:</span>
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              max="1"
                              value={s.prob}
                              onChange={(e) => handleStateChange(s.id, 'prob', e.target.value)}
                              className="bg-slate-950 text-indigo-300 text-center border border-slate-700 rounded px-1 py-0.5 w-16 focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                        </th>
                      ))}
                      <th className="p-3 border-b border-slate-700 border-l border-slate-800 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 bg-slate-900/40">
                    {alternatives.map((alt) => (
                      <tr key={alt.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-medium text-slate-200">
                          <input
                            type="text"
                            value={alt.name}
                            onChange={(e) => handleAlternativeNameChange(alt.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-100 rounded px-2 py-1 w-full focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </td>
                        {states.map((s) => (
                          <td key={s.id} className="p-2 border-l border-slate-800 text-center">
                            <input
                              type="number"
                              value={payoffs[alt.id]?.[s.id] ?? 0}
                              onChange={(e) => handlePayoffChange(alt.id, s.id, e.target.value)}
                              className="bg-slate-950 border border-slate-700/80 text-right text-emerald-400 font-mono rounded px-2 py-1 w-24 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                        ))}
                        <td className="p-2 border-l border-slate-800 text-center">
                          {alternatives.length > 1 && (
                            <button
                              onClick={() => handleRemoveAlternative(alt.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              title="Delete Alternative"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isProbValid && (
                <div className="mt-4 p-3 bg-amber-950/40 border border-amber-700/50 rounded-lg flex items-center justify-between text-xs text-amber-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Warning: Total state probabilities sum to <strong>{probSum.toFixed(4)}</strong> (should equal 1.0). EMV calculations might be scaled.</span>
                  </div>
                  <button
                    onClick={normalizeProbabilities}
                    className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded font-medium transition-colors"
                  >
                    Normalize Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DECISION CRITERIA ENGINE */}
        {activeTab === 'analysis' && analysisResults && (
          <div className="space-y-6">
            
            {/* Criteria Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Maximax (Optimistic) Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Optimistic</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Maximax
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Best-Case Focus</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Selects the alternative offering the maximum possible upside.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-400">Optimal Value:</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">
                    {analysisResults.bestOptimisticVal}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-200">
                    Recommended: {analysisResults.maximaxWinners.map(w => w.name).join(", ")}
                  </div>
                </div>
              </div>

              {/* Maximin (Pessimistic) Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pessimistic</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                      Maximin
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Worst-Case Hedge</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Maximizes the minimum possible outcome (safeguard against loss).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-400">Optimal Value:</div>
                  <div className="text-lg font-mono font-bold text-amber-400">
                    {analysisResults.bestPessimisticVal}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-200">
                    Recommended: {analysisResults.maximinWinners.map(w => w.name).join(", ")}
                  </div>
                </div>
              </div>

              {/* Minimax Regret Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Savage Criterion</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-400 border border-purple-800">
                      Minimax Regret
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Regret Minimizer</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Minimizes the maximum regret / opportunity loss across states.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-400">Min Maximum Regret:</div>
                  <div className="text-lg font-mono font-bold text-purple-400">
                    {analysisResults.minMaxRegretVal}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-200">
                    Recommended: {analysisResults.minimaxRegretWinners.map(w => w.name).join(", ")}
                  </div>
                </div>
              </div>

              {/* EMV / Bayes Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Probabilistic</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
                      EMV / Bayes
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">Expected Value</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Weighted average payoff based on state probability distribution.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-400">Highest Expected Value:</div>
                  <div className="text-lg font-mono font-bold text-indigo-400">
                    {analysisResults.bestEMVVal.toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-200">
                    Recommended: {analysisResults.emvWinners.map(w => w.name).join(", ")}
                  </div>
                </div>
              </div>

            </div>

            {/* Comprehensive Results Table */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Comprehensive Criteria Performance Matrix
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="p-3 border-b border-slate-700">Alternative</th>
                      <th className="p-3 border-b border-slate-700 text-center">Optimistic (Maximax)</th>
                      <th className="p-3 border-b border-slate-700 text-center">Pessimistic (Maximin)</th>
                      <th className="p-3 border-b border-slate-700 text-center">Max Regret</th>
                      <th className="p-3 border-b border-slate-700 text-center font-bold text-indigo-300">EMV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 bg-slate-900/40 font-mono">
                    {analysisResults.altStats.map((alt) => {
                      const isMaximax = analysisResults.maximaxWinners.some(w => w.id === alt.id);
                      const isMaximin = analysisResults.maximinWinners.some(w => w.id === alt.id);
                      const regretStat = analysisResults.regretStats.find(r => r.id === alt.id);
                      const isRegretWinner = analysisResults.minimaxRegretWinners.some(w => w.id === alt.id);
                      const isEmvWinner = analysisResults.emvWinners.some(w => w.id === alt.id);

                      return (
                        <tr key={alt.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-sans font-medium text-slate-200">
                            {alt.name}
                          </td>
                          <td className={`p-3 text-center ${isMaximax ? 'bg-emerald-950/40 font-bold text-emerald-300' : ''}`}>
                            {alt.optimisticVal} {isMaximax && '★'}
                          </td>
                          <td className={`p-3 text-center ${isMaximin ? 'bg-amber-950/40 font-bold text-amber-300' : ''}`}>
                            {alt.pessimisticVal} {isMaximin && '★'}
                          </td>
                          <td className={`p-3 text-center ${isRegretWinner ? 'bg-purple-950/40 font-bold text-purple-300' : ''}`}>
                            {regretStat?.maxRegret} {isRegretWinner && '★'}
                          </td>
                          <td className={`p-3 text-center font-bold ${isEmvWinner ? 'bg-indigo-950/60 text-indigo-300' : 'text-slate-300'}`}>
                            {alt.emv.toFixed(2)} {isEmvWinner && '★'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Savage Regret Matrix Breakdown & EVPI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Regret Matrix */}
              <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Grid className="w-4 h-4 text-purple-400" />
                  Savage Regret (Opportunity Loss) Matrix
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Calculated by subtracting actual payoff from the best possible payoff for each state of nature.
                </p>
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="p-2.5 border-b border-slate-700">Alternative</th>
                        {states.map(s => (
                          <th key={s.id} className="p-2.5 border-b border-slate-700 border-l border-slate-800 text-center">
                            {s.name}
                          </th>
                        ))}
                        <th className="p-2.5 border-b border-slate-700 border-l border-slate-800 text-center text-purple-300">Max Regret</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 font-mono">
                      {analysisResults.regretStats.map(r => (
                        <tr key={r.id}>
                          <td className="p-2.5 font-sans font-medium text-slate-200">{r.name}</td>
                          {r.regrets.map((reg, i) => (
                            <td key={i} className="p-2.5 border-l border-slate-800 text-center text-purple-200/90">
                              {reg}
                            </td>
                          ))}
                          <td className="p-2.5 border-l border-slate-800 text-center font-bold text-purple-300 bg-purple-950/20">
                            {r.maxRegret}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EVPI Breakdown Panel */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-400" />
                    Value of Perfect Information (EVPI)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Maximum price you should pay to acquire perfect information/forecasting.
                  </p>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-700/50">
                      <span className="text-slate-400">EV Under Certainty (EVUC):</span>
                      <span className="font-mono font-bold text-slate-200">{analysisResults.evuc.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-700/50">
                      <span className="text-slate-400">Best Expected Value (EMV*):</span>
                      <span className="font-mono font-bold text-slate-200">{analysisResults.bestEMVVal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/70">
                  <div className="text-xs text-slate-400">EVPI = |EVUC - EMV*|</div>
                  <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
                    {analysisResults.evpi.toFixed(2)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Investing more than this amount for market studies or research would be economically inefficient.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: STAGED FILTERING & ELIMINATION PIPELINE */}
        {activeTab === 'filtering' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Configure Staged Elimination Rules
                  </h2>
                  <p className="text-xs text-slate-400">
                    Set up sequential criteria filters to narrow down alternatives step-by-step.
                  </p>
                </div>
                <button
                  onClick={addFilterStage}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pipeline Stage</span>
                </button>
              </div>

              {/* Filtering Rules Controls */}
              <div className="space-y-3">
                {filteringConfig.map((stage, idx) => (
                  <div key={stage.id} className="flex flex-wrap items-center gap-3 p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs">
                    <span className="font-bold text-indigo-400 w-16">Stage {idx + 1}:</span>
                    
                    {/* Criterion select */}
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Criterion:</span>
                      <select
                        value={stage.criterion}
                        onChange={(e) => updateStageConfig(stage.id, 'criterion', e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 outline-none"
                      >
                        <option value="maximax">Maximax (Optimistic)</option>
                        <option value="maximin">Maximin (Pessimistic)</option>
                        <option value="minimaxRegret">Minimax Regret</option>
                        <option value="emv">Expected Value (EMV)</option>
                      </select>
                    </div>

                    {/* Filter Type */}
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Filter rule:</span>
                      <select
                        value={stage.thresholdType}
                        onChange={(e) => updateStageConfig(stage.id, 'thresholdType', e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 outline-none"
                      >
                        <option value="best">Keep Absolute Best (with ties)</option>
                        <option value="topN font-mono">Keep Top N Alternatives</option>
                        <option value="scoreLimit">Threshold Value Limit</option>
                      </select>
                    </div>

                    {/* Value Input if topN or scoreLimit */}
                    {stage.thresholdType !== 'best' && (
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-400">Value:</span>
                        <input
                          type="number"
                          step="1"
                          value={stage.thresholdValue}
                          onChange={(e) => updateStageConfig(stage.id, 'thresholdValue', e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-slate-100 rounded px-2 py-1 w-20 outline-none font-mono"
                        />
                      </div>
                    )}

                    {filteringConfig.length > 1 && (
                      <button
                        onClick={() => removeFilterStage(stage.id)}
                        className="ml-auto text-slate-500 hover:text-rose-400 p-1"
                        title="Remove Stage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Step-by-Step Visualization */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-400" />
                Elimination Pipeline Execution Output
              </h3>

              {stagedFilteringResults.map((stg) => (
                <div key={stg.stageIndex} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                    <span className="font-bold text-sm text-indigo-300">
                      Stage {stg.stageIndex}: Filter by {stg.config.criterion.toUpperCase()} ({stg.config.thresholdType})
                    </span>
                    <span className="text-xs text-slate-400">
                      Input Count: {stg.inputCandidates?.length || 0} → Retained: {stg.passed?.length || 0}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Retained Candidates */}
                    <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3">
                      <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        Surviving Alternatives ({stg.passed?.length})
                      </h4>
                      <div className="space-y-1.5">
                        {stg.passed?.map(alt => {
                          const detail = stg.scoredDetails?.find(d => d.id === alt.id);
                          return (
                            <div key={alt.id} className="flex justify-between items-center bg-emerald-900/30 px-2 py-1 rounded border border-emerald-700/30">
                              <span className="font-medium text-emerald-200">{alt.name}</span>
                              <span className="font-mono text-emerald-300">Score: {detail?.score?.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Eliminated Candidates */}
                    <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-3">
                      <h4 className="font-semibold text-rose-400 flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Eliminated at this Stage ({stg.eliminated?.length})
                      </h4>
                      {stg.eliminated?.length === 0 ? (
                        <p className="text-slate-500 italic">No alternatives eliminated in this stage.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {stg.eliminated?.map(alt => {
                            const detail = stg.scoredDetails?.find(d => d.id === alt.id);
                            return (
                              <div key={alt.id} className="flex justify-between items-center bg-rose-900/30 px-2 py-1 rounded border border-rose-700/30 line-through opacity-75">
                                <span className="font-medium text-rose-200">{alt.name}</span>
                                <span className="font-mono text-rose-300">Score: {detail?.score?.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DECISION FLOWCHART DIAGRAM */}
        {activeTab === 'diagram' && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-indigo-400" />
                Visual Decision Flowchart & Elimination Path
              </h2>
              <p className="text-xs text-slate-400">
                Interactive sequence diagram tracing candidate alternatives from initial pool down to final recommendation.
              </p>
            </div>

            {/* Diagram Flow Container */}
            <div className="overflow-x-auto p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="min-w-[700px] flex items-center justify-between gap-4">
                
                {/* Initial Node */}
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-slate-800 border-2 border-slate-600 rounded-xl text-center shadow-md w-44">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Initial Pool</span>
                    <h4 className="text-xs font-bold text-slate-200 mt-1">{alternatives.length} Alternatives</h4>
                    <div className="mt-2 text-[10px] text-slate-400 space-y-1">
                      {alternatives.map(a => (
                        <div key={a.id} className="truncate">{a.name}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Staged Nodes */}
                {stagedFilteringResults.map((stg, i) => (
                  <React.Fragment key={stg.stageIndex}>
                    {/* Connector Arrow */}
                    <div className="flex flex-col items-center justify-center text-slate-500 px-1">
                      <ArrowRight className="w-5 h-5 text-indigo-400" />
                      <span className="text-[9px] font-mono text-slate-400 mt-1">Stage {stg.stageIndex}</span>
                    </div>

                    {/* Stage Box */}
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-slate-900 border-2 border-indigo-500/50 rounded-xl text-center shadow-md w-48 relative">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                          {stg.config.criterion}
                        </span>
                        <div className="mt-2 text-[11px] font-semibold text-emerald-300">
                          Passed ({stg.passed?.length})
                        </div>
                        <div className="text-[10px] text-slate-300 space-y-0.5 mt-1 max-h-24 overflow-y-auto">
                          {stg.passed?.map(p => (
                            <div key={p.id} className="truncate bg-slate-800/60 rounded px-1">{p.name}</div>
                          ))}
                        </div>

                        {stg.eliminated?.length > 0 && (
                          <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] text-rose-400">
                            Eliminated: {stg.eliminated.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                ))}

                {/* Connector Arrow to Final */}
                <div className="flex flex-col items-center justify-center text-slate-500 px-1">
                  <ArrowRight className="w-5 h-5 text-emerald-400" />
                  <span className="text-[9px] font-mono text-emerald-400 mt-1">Outcome</span>
                </div>

                {/* Final Recommendation Box */}
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 border-2 border-emerald-500 rounded-xl text-center shadow-lg shadow-emerald-950/50 w-52">
                    <Award className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Final Recommendation</span>
                    <div className="mt-2 space-y-1">
                      {stagedFilteringResults[stagedFilteringResults.length - 1]?.passed?.map(res => (
                        <div key={res.id} className="text-xs font-bold text-white bg-emerald-900/40 py-1 px-2 rounded border border-emerald-700/50">
                          {res.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            C10 Decision Analysis Model & Engine • Built under uncertainty analysis standards.
          </div>
          <div>
            <a
              href="https://chat.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1 font-medium"
            >
              <span>AI Conversation Development Record</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}