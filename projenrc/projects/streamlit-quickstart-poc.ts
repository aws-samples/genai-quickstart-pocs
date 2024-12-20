import * as fs from 'fs';
import * as path from 'path';
import * as nunjucks from 'nunjucks';
import { Component, Project, SampleFile, TextFile } from 'projen';
import { PythonProject } from 'projen/lib/python';
import { POCReadmeDetails } from './resources/types';

interface StreamlitQuickStartPOCProps {
  parentProject: Project;
  pocName: string;
  pocPackageName: string;
  pocDescription?: string;
  additionalDeps?: string[];
  excludeFromReadmeManagement?: boolean;
  gitIgnore?: string[];
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


export class StreamlitQuickStartPOC extends PythonProject {
  public pocProps: StreamlitQuickStartPOCProps;
  constructor(props: StreamlitQuickStartPOCProps) {
    super({
      parent: props.parentProject,
      outdir: path.join('genai-quickstart-pocs-python', props.pocPackageName),
      projenrcTs: true,
      name: props.pocPackageName,
      description: props.pocDescription,
      deps: ['streamlit', 'boto3', 'botocore', 'python-dotenv'],
      pip: true,
      gitIgnoreOptions: {
        ignorePatterns: ['.env/*', 'venv/*', ...props.gitIgnore ?? []],
      },
      venv: true,
      sample: false,
      authorEmail: 'no-email@aws.amazon.com',
      authorName: 'AWS',
      license: 'MIT-0',
      moduleName: props.pocPackageName,
      version: '0.0.1',
      github: false,
    });
    this.pocProps = props;
    for (const dep of props.additionalDeps ?? []) {
      this.addDependency(dep);
    }

    this.addTask('start', {
      description: 'Run Streamlit app in virtual environment',
      exec: [
        // Create venv if it doesn't exist
        '[ ! -d ".env" ] && python3 -m venv .env || true',

        // Run everything else in a single bash context to maintain the activated venv
        'sh -c "source .env/bin/activate && trap deactivate EXIT && streamlit run app.py"',
      ].join(' && '),
    });
    new POCProjectFiles(this, props);
  }

  public get readmeDetails(): POCReadmeDetails {
    return {
      pocDescription: this.pocProps.pocDescription ?? this.pocProps.pocName,
      pocName: this.pocProps.pocName,
      imagePath: `genai-quickstart-pocs-python/${this.pocProps.pocPackageName}/images/demo.gif`,
      architectureImage: this.pocProps.readme?.pocGoal?.architectureImage ?? false,
    };
  }

  postSynthesize() {
    // Overriding the default postSynth to avoid every POC installing dependencies!
  }

  runPOC() {
    this.envManager.setupEnvironment();
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
    if (!(this.pocProps.excludeFromReadmeManagement ?? false)) {
      this.project.tryRemoveFile('README.md');
      new README(this.project, 'README.md', this.pocProps);
    }
    new HOWTO(this.project).synthesize();
    if (!this.pocProps.skipApp) {
      new AppDotPy(this.project, this.pocProps).synthesize();
    }

  }
}

class README extends TextFile {
  constructor(scope: Project, id: string, props: StreamlitQuickStartPOCProps) {
    const README_TEMPLATE = path.join(__dirname, 'resources', 'streamlit-readme.md');
    const readmeTemplate = fs.readFileSync(README_TEMPLATE, 'utf-8');
    const content = nunjucks.renderString(readmeTemplate, {
      pocTitle: props.pocName,
      pocOverview: props.pocDescription,
      pocPath: `genai-quickstart-pocs-python/${props.pocPackageName}`,
      additionalPrerequisits: props.readme?.additionalPrerequisits,
      pocGoal: props.readme?.pocGoal,
      fileWalkthrough: props.readme?.fileWalkthrough,
      extraSteps: props.readme?.extraSteps,
      finalText: props.readme?.finalText,
    });
    super(scope, id, {
      lines: content.split('\n'),
    });
  }
}


class HOWTO extends SampleFile {
  constructor(scope: Project) {
    const HOWTO_TEMPLATE: string = path.join(
      __dirname,
      'resources',
      'streamlit-howto.md',
    );
    const howtoTemplate = fs.readFileSync(HOWTO_TEMPLATE, 'utf-8');
    super(scope, 'HOWTO.md', {
      contents: howtoTemplate,
    });
  }
}

class AppDotPy extends SampleFile {
  constructor(scope: Project, props: StreamlitQuickStartPOCProps) {
    const APP_TEMPLATE = path.join(__dirname, 'resources', 'streamlit-app.py');
    const appTemplate = fs.readFileSync(APP_TEMPLATE, 'utf-8');
    const content = nunjucks.renderString(appTemplate, {
      outDir: path.join('genai-quickstart-pocs-python', props.pocPackageName, 'app.py'),
    });
    super(scope, 'app.py', {
      contents: content,
    });
  }
}
