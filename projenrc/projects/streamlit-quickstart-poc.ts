import * as fs from 'fs';
import * as path from 'path';
import * as nunjucks from 'nunjucks';
import { Component, Project, SampleFile } from 'projen';
import { PythonProject } from 'projen/lib/python';

interface StreamlitQuickStartPOCProps {
  parentProject: Project;
  pocName: string;
  pocPackageName: string;
  pocDescription?: string;
  additionalDeps?: string[];
  readme?: {
    additionalPrerequisits?: string[];
    pocGoal?: {
      overview: string;
      architectureImage: boolean;
      flowSteps?: string[];
    };
    /**
     * File walkthrough for the project
     * Note: by default app.py, requirements.txt are already included.
     */
    fileWalkthrough?: {
      includeDefaults?: boolean;
      files: Array<{
        name: string;
        description: string;
      }>;
    };
    extraSteps?: Array<{
      instructions: string;
      command?: string;
    }>;
  };
  skipApp?: boolean;
}

export class StreamlitQuickStartPOC extends PythonProject {
  constructor(props: StreamlitQuickStartPOCProps) {
    super({
      parent: props.parentProject,
      outdir: path.join('genai-quickstart-pocs-python', props.pocPackageName),
      projenrcTs: true,
      name: props.pocPackageName,
      description: props.pocDescription,
      deps: [
        'streamlit',
        'boto3',
        'botocore',
        'python-dotenv',
      ],
      pip: true,
      venv: true,
      sample: false,
      authorEmail: 'no-email@aws.amazon.com',
      authorName: 'AWS',
      license: 'MIT-0',
      moduleName: props.pocPackageName,
      version: '0.0.1',
      github: false,
    });
    for (const dep of props.additionalDeps ?? []) {
      this.addDependency(dep);
    }
    new POCProjectFiles(this, props);
  }


  postSynthesize() {
    // Overriding the default postSynth to avoid every POC installing dependencies!
  }
}


class POCProjectFiles extends Component {
  private pocProps: StreamlitQuickStartPOCProps;
  constructor(project: Project, props: StreamlitQuickStartPOCProps) {
    super(project);
    this.pocProps = props;

  }
  /**
   * Synthesize the project files
   */
  public synthesize(): void {
    new README(this.project, this.pocProps).synthesize();
    new HOWTO(this.project).synthesize();
    if (!this.pocProps.skipApp) {
      new AppDotPy(this.project).synthesize();
    }

  }

}


class README extends SampleFile {
  constructor(scope: Project, pocProps: StreamlitQuickStartPOCProps) {
    try {
      const README_TEMPLATE = path.join(__dirname, 'resources', 'streamlit-readme.md');
      const readmeTemplate = fs.readFileSync(README_TEMPLATE, 'utf-8');
      const readmeContent = nunjucks.renderString(readmeTemplate, {
        pocTitle: pocProps.pocName,
        pocOverview: pocProps.pocDescription,
        pocPath: `genai-quickstart-pocs-python/${pocProps.pocPackageName}`,
        additionalPrerequisits: pocProps.readme?.additionalPrerequisits,
        pocGoal: pocProps.readme?.pocGoal,
        fileWalkthrough: pocProps.readme?.fileWalkthrough,
        extraSteps: pocProps.readme?.extraSteps,
      });
      super(scope, 'README.md', {
        contents: readmeContent,
      });
    } catch (e) {
      console.error(`Error with README ${scope.name}`, e);
    }
  }
}

class HOWTO extends SampleFile {
  constructor(scope: Project) {
    const HOWTO_TEMPLATE: string = path.join(__dirname, 'resources', 'streamlit-howto.md');
    const howtoTemplate = fs.readFileSync(HOWTO_TEMPLATE, 'utf-8');
    super(scope, 'HOWTO.md', {
      contents: howtoTemplate,
    });
  }
}

class AppDotPy extends SampleFile {
  constructor(scope: Project) {
    const APP_TEMPLATE = path.join(__dirname, 'resources', 'streamlit-app.py');
    const appTemplate = fs.readFileSync(APP_TEMPLATE, 'utf-8');
    super(scope, 'app.py', {
      contents: appTemplate,
    });
  }
}