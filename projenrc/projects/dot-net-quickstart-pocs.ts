import { Component, Project } from 'projen';

interface DotNetQuickStartPOCDetails {
  pocName: string;
  pocDescription: string;
  imagePath?: string;
}

export class DotNetQuickStartPOC extends Component {
  private _dotNetPocs: DotNetQuickStartPOCDetails[];
  constructor(scope: Project, id: string) {
    super(scope, id);
  }

  public addPoc (pocDetails: DotNetQuickStartPOCDetails): void {
    this._dotNetPocs.push(pocDetails);
  };

  public get dotNetPocs(): DotNetQuickStartPOCDetails[] {
    return this._dotNetPocs;
  }
}