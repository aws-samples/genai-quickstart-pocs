// Customer types
export interface Customer {
  id: string;
  demographics: {
    age: number;
    incomeBracket: string;
  };
  investmentObjectives: {
    timeHorizon: string;
    riskPreference: string;
  };
}