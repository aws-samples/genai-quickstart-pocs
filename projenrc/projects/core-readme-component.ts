import fs from 'fs';
import path from 'path';
import * as nunjucks from 'nunjucks';
import { Component, Project, TextFile } from 'projen';
import { POCReadmeDetails } from './resources/types';

export class READMEComponent extends Component {
  private pythonPocs: POCReadmeDetails[];
  private dotNetPocs: POCReadmeDetails[];
  constructor(scope: Project, id: string, pythonPocs: POCReadmeDetails[], dotNetPocs: POCReadmeDetails[]) {
    super(scope, id);
    this.dotNetPocs = dotNetPocs;
    this.pythonPocs = pythonPocs;
  }

  synthesize(): void {
    this.project.tryRemoveFile('README.md');
    const README_TEMPLATE = path.join(__dirname, 'resources', 'root-readme.md');
    const readmeTemplate = fs.readFileSync(README_TEMPLATE, 'utf-8');
    const renderedReadmeContent = nunjucks.renderString(readmeTemplate, {
      pocs: {
        pythonPocs: this.pythonPocs,
        dotNetPocs: this.dotNetPocs,
      },
    });
    new TextFile(this.project, 'README.md', {
      lines: renderedReadmeContent.split('\n'),
    });
  }
}