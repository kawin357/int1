import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Infinity } from "lucide-react";

export type AIModel = 'int' | 'int.go' | 'int.do';

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const ModelSelector = ({ selectedModel, onModelChange }: ModelSelectorProps) => {
  const getModelLabel = (model: AIModel) => {
    switch (model) {
      case 'int': return <div className="flex items-center gap-1"><Infinity size={14} className="sm:w-4 sm:h-4" /><span>int</span></div>;
      case 'int.go': return 'int.go';
      case 'int.do': return 'int.do';
      default: return <div className="flex items-center gap-1"><Infinity size={14} className="sm:w-4 sm:h-4" /><span>int</span></div>;
    }
  };

  return (
    <Select value={selectedModel} onValueChange={(value) => onModelChange(value as AIModel)}>
      <SelectTrigger className="w-16 sm:w-[95px] h-7 sm:h-9 text-[9px] sm:text-xs font-semibold bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 backdrop-blur-md border border-blue-300/30 hover:from-blue-500/30 hover:via-cyan-500/30 hover:to-teal-500/30 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg sm:rounded-xl px-1.5 sm:px-2">
        <SelectValue>
          {getModelLabel(selectedModel)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[70px] sm:min-w-[95px] bg-white/95 backdrop-blur-xl border border-blue-200/50 rounded-xl shadow-2xl">
        <SelectItem value="int" className="text-[9px] sm:text-xs font-semibold hover:bg-blue-50 cursor-pointer">
          <div className="flex items-center gap-1 sm:gap-2">
            <Infinity size={12} className="sm:w-4 sm:h-4" />
            <span>int</span>
          </div>
        </SelectItem>
        <SelectItem value="int.go" className="text-[9px] sm:text-xs font-semibold hover:bg-teal-50 cursor-pointer">
          <span className="text-gray-600 text-[9px] sm:text-xs">int.go</span>
        </SelectItem>
        <SelectItem value="int.do" className="text-[9px] sm:text-xs font-semibold hover:bg-emerald-50 cursor-pointer">
          <span className="text-gray-600 text-[9px] sm:text-xs">int.do</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
