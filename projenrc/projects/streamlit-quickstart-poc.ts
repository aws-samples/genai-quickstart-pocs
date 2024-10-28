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
    /**
     * Any additional text to include at the end.
     */
    finalText?: string;
  };
  skipApp?: boolean;
}

const generateREADME = (props: StreamlitQuickStartPOCProps): string => {
  const README_TEMPLATE = path.join(__dirname, 'resources', 'streamlit-readme.md');
  const readmeTemplate = fs.readFileSync(README_TEMPLATE, 'utf-8');
  return nunjucks.renderString(readmeTemplate, {
    pocTitle: props.pocName,
    pocOverview: props.pocDescription,
    pocPath: `genai-quickstart-pocs-python/${props.pocPackageName}`,
    additionalPrerequisits: props.readme?.additionalPrerequisits,
    pocGoal: props.readme?.pocGoal,
    fileWalkthrough: props.readme?.fileWalkthrough,
    extraSteps: props.readme?.extraSteps,
    finalText: props.readme?.finalText,
  });
};

export class StreamlitQuickStartPOC extends PythonProject {
  constructor(props: StreamlitQuickStartPOCProps) {
    super({
      parent: props.parentProject,
      outdir: path.join('genai-quickstart-pocs-python', props.pocPackageName),
      projenrcTs: true,
      name: props.pocPackageName,
      description: props.pocDescription,
      readme: {
        contents: generateREADME(props),
      },
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
    new HOWTO(this.project).synthesize();
    if (!this.pocProps.skipApp) {
      new AppDotPy(this.project).synthesize();
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