import * as fs from 'fs';
import * as path from 'path';
import * as nunjucks from 'nunjucks';
import { Component, Project } from 'projen';
import { PythonProject } from 'projen/lib/python';

interface StreamlitQuickStartPOCProps {
  pocName: string;
  pocPackageName: string;
  pocDescription?: string;
  additionalDeps?: string[];
  readme?: {
    additionalPrerequisits?: string[];
    pocGoal?: {
      overview: string;
      architectureImage: boolean;
      flowSteps: string[];
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
      outdir: path.join(__dirname, '../../', 'genai-quickstart-pocs-python', props.pocPackageName),
      projenrcPython: true,
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
    new POCProjectFiles(this, props).synthesize();
  }
}


class POCProjectFiles extends Component {
  private pocProps: StreamlitQuickStartPOCProps;
  private readonly readmeTemplatePath: string = path.join(__dirname, 'resources', 'streamlit-readme.md');
  private readonly howtoTemplatePath: string = path.join(__dirname, 'resources', 'streamlit-howto.md');
  private readonly sampleCodeTemplatePath: string = path.join(__dirname, 'resources', 'streamlit-app.py');
  constructor(project: Project, props: StreamlitQuickStartPOCProps) {
    super(project);
    this.pocProps = props;

  }
  /**
   * Synthesize the project files
   */
  public synthesize(): void {
    this.synthesizeReadme();
    this.synthesizeSampleCode();
  }

  /**
   * Synthesize the README.md file
   */
  private synthesizeReadme(): void {
    if (!fs.existsSync(path.join(this.project.outdir, 'README.md'))) {
      console.log('Generating README.md');
      //Generate the readme file from the template
      const readmeTemplate = fs.readFileSync(this.readmeTemplatePath, 'utf-8');
      const readmeContent = nunjucks.renderString(readmeTemplate, {
        pocTitle: this.pocProps.pocName,
        pocOverview: this.pocProps.pocDescription,
        pocPath: `genai-quickstart-pocs-python/${this.pocProps.pocPackageName}`,
        additionalPrerequisits: this.pocProps.readme?.additionalPrerequisits,
        pocGoal: this.pocProps.readme?.pocGoal,
        fileWalkthrough: this.pocProps.readme?.fileWalkthrough,
        extraSteps: this.pocProps.readme?.extraSteps,
      });
      fs.writeFileSync(path.join(this.project.outdir, 'README.md'), readmeContent);
      console.log('Generating HOWTO.md');
      fs.copyFileSync(this.howtoTemplatePath, path.join(this.project.outdir, 'HOWTO.md'));
    }
  }

  /**
   * Synthesize the sample code
   */
  private synthesizeSampleCode(): void {
    if (!fs.existsSync(path.join(this.project.outdir, 'app.py')) && !(this.pocProps.skipApp !== undefined ? this.pocProps.skipApp : false)) {
      console.log('Generating app.py');
      const appTemplate = fs.readFileSync(this.sampleCodeTemplatePath, 'utf-8');
      const appContent = nunjucks.renderString(appTemplate, {
        outDir: this.project.outdir,
      });
      fs.writeFileSync(path.join(this.project.outdir, 'app.py'), appContent);
    }
  }
}