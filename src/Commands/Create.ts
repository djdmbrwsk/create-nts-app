import os from 'os';
import path from 'path';

import spawn from 'cross-spawn';
import fs from 'fs-extra';
import fetch from 'node-fetch';
import { Arguments, Argv, CommandModule } from 'yargs';

import { CommonArgs } from '../bin/create-nts-app';

interface CreateArgs {
  app: string;
  template: string;
}

class Create implements CommandModule<CommonArgs, CreateArgs> {
  command = '* [app]';
  describe = 'Setup a new Node TypeScript app';
  builder = (args: Argv<CommonArgs>): Argv<CreateArgs> => {
    return args
      .positional('app', {
        default: 'new-nts-app', // Required to solve TypeScript error
        describe: 'The name of your new app',
        string: true,
      })
      .option('template', {
        default: 'nts-template',
        describe: 'Template to use for your new app',
        string: true,
      });
  };
  handler = async (args: Arguments<CreateArgs>): Promise<void> => {
    const { app, template, verbose } = args;

    // Make app directory
    const appDir = path.resolve(app);
    if (fs.existsSync(appDir)) {
      throw new Error(`There's already a directory '${appDir}'`);
    }
    fs.mkdirSync(appDir);

    // Resolve template
    const tempDir = path.join(appDir, 'temp');
    fs.mkdirSync(tempDir);
    if (template.startsWith('file:')) {
      const localTemplateDir = path.resolve(template.substr(5));
      if (!fs.existsSync(localTemplateDir)) {
        throw new Error(
          `Unable to find local template directory '${localTemplateDir}'`,
        );
      }
      fs.copySync(localTemplateDir, tempDir);
    } else if (template.endsWith('.git')) {
      // TODO: check for error
      spawn.sync('git', ['clone', template, tempDir], {
        stdio: 'inherit',
        cwd: appDir,
      });
    } else {
      const npmPackage =
        template === 'nts-template'
          ? 'nts-template'
          : `nts-template-${template}`;

      // Check that template exists
      const res = await fetch(`https://registry.npmjs.org/${npmPackage}`);
      if (!res.ok) {
        throw new Error(`Unable to find template on npm '${npmPackage}'`);
      }

      // Install it and copy it into the temp folder
      spawn.sync('npm', ['i', npmPackage], {
        stdio: 'inherit',
        cwd: tempDir,
      });
      const npmPackageLocation = path.resolve(
        tempDir,
        'node_modules',
        npmPackage,
      );
      fs.copySync(npmPackageLocation, tempDir);
      fs.rmSync(path.resolve(tempDir, 'node_modules'), {
        force: true,
        recursive: true,
      });
    }

    // Verify template
    const templateDir = path.join(tempDir, 'template');
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Template doesn't have a '/template' directory`);
    }
    const templateJsonFile = path.join(tempDir, 'template.json');
    if (!fs.existsSync(templateJsonFile)) {
      throw new Error(`Template doesn't have a 'template.json' file`);
    }

    // Prepare package.json
    let appPackage = {
      name: app,
      version: '0.0.0',
      private: true,
      scripts: {
        build: 'nts-scripts build',
        clean: 'nts-scripts clean',
        format: 'nts-scripts format',
        lint: 'nts-scripts lint',
        start: 'nts-scripts start',
        test: 'nts-scripts test',
        watch: 'nts-scripts watch',
      },
      dependencies: {},
      devDependencies: {},
    };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const templatePackage = require(templateJsonFile)?.package || {};

    // Merge dependencies, devDependencies, scripts
    appPackage.dependencies = {
      ...appPackage.dependencies,
      ...templatePackage.dependencies,
    };
    appPackage.devDependencies = {
      ...appPackage.devDependencies,
      ...templatePackage.devDependencies,
    };
    appPackage.scripts = {
      ...appPackage.scripts,
      ...templatePackage.scripts,
    };

    // Copy other package fields
    appPackage = {
      ...templatePackage,
      ...appPackage,
    };

    // Write package.json file
    fs.writeFileSync(
      path.join(appDir, 'package.json'),
      JSON.stringify(appPackage, undefined, 2) + os.EOL,
    );

    // Install dependencies (and implicitly create a package-lock.json)
    spawn.sync('npm', ['i'], {
      stdio: 'inherit',
      cwd: appDir,
    });

    // Install latest version of nts-scripts
    spawn.sync('npm', ['i', '-D', 'nts-scripts'], {
      stdio: 'inherit',
      cwd: appDir,
    });

    // Copy template files
    fs.copySync(templateDir, appDir);

    // Clean up temp template dir
    fs.removeSync(tempDir);

    // Rename gitignore --> .gitignore
    const gitignoreFile = path.join(appDir, 'gitignore');
    if (fs.existsSync(gitignoreFile)) {
      fs.renameSync(gitignoreFile, path.join(appDir, '.gitignore'));
    }

    // Git init/commit
    spawn.sync('git', ['init'], {
      stdio: 'inherit',
      cwd: appDir,
    });
    spawn.sync('git', ['add', '.'], {
      stdio: 'inherit',
      cwd: appDir,
    });
    spawn.sync(
      'git',
      ['commit', '-m', 'Initialize project using create-nts-app'],
      {
        stdio: 'inherit',
        cwd: appDir,
      },
    );
  };
}

export default new Create();
