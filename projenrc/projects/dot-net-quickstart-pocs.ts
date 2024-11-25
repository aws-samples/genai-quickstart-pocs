import { POCReadmeDetails } from './resources/types';
export class DotNetQuickStartPOCs {
  private _dotNetPocs: POCReadmeDetails[] = [];

  public addPoc (pocDetails: POCReadmeDetails): void {
    this._dotNetPocs.push(pocDetails);
  };

  public get dotNetPocs(): POCReadmeDetails[] {
    return this._dotNetPocs;
  }
}