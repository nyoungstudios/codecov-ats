/* eslint-disable  @typescript-eslint/no-explicit-any */

import * as core from '@actions/core';
import * as github from '@actions/github';

import {getParentCommit, getPRBaseCommit} from './helpers';


const context = github.context;

const isTrue = (variable) => {
  const lowercase = variable.toLowerCase();
  return (
    lowercase === '1' ||
    lowercase === 't' ||
    lowercase === 'true' ||
    lowercase === 'y' ||
    lowercase === 'yes'
  );
};


const buildCommitExec = () => {
  const commitParent = core.getInput('commit_parent');
  const overrideBranch = core.getInput('override_branch');
  const overrideCommit = core.getInput('override_commit');
  const overridePr = core.getInput('override_pr');
  const slug = core.getInput('slug');
  const token = core.getInput('token');

  const commitCommand = 'create-commit';
  const commitExecArgs = [];

  const commitOptions:any = {};
  commitOptions.env = Object.assign(process.env, {
    GITHUB_ACTION: process.env.GITHUB_ACTION,
    GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
    GITHUB_REF: process.env.GITHUB_REF,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_SHA: process.env.GITHUB_SHA,
    GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF || '',
  });

  if (token) {
    commitOptions.env.CODECOV_TOKEN = token;
  }
  if (commitParent) {
    commitExecArgs.push('--parent-sha', `${commitParent}`);
  }

  if (overrideBranch) {
    commitExecArgs.push('-B', `${overrideBranch}`);
  }
  if (overrideCommit) {
    commitExecArgs.push('-C', `${overrideCommit}`);
  } else if (
    `${context.eventName}` == 'pull_request' ||
    `${context.eventName}` == 'pull_request_target'
  ) {
    commitExecArgs.push('-C', `${context.payload.pull_request.head.sha}`);
  }
  if (overridePr) {
    commitExecArgs.push('--pr', `${overridePr}`);
  } else if (
    `${context.eventName}` == 'pull_request_target'
  ) {
    commitExecArgs.push('--pr', `${context.payload.number}`);
  }
  if (slug) {
    commitExecArgs.push('--slug', `${slug}`);
  }

  return {commitExecArgs, commitOptions, commitCommand};
};

const buildGeneralExec = () => {
  const failCi = isTrue(core.getInput('fail_ci_if_error'));
  const os = core.getInput('os');
  const url = core.getInput('url');
  const verbose = isTrue(core.getInput('verbose'));
  let uploaderVersion = core.getInput('version');

  const args = [];

  if (url) {
    args.push('--enterprise-url', `${url}`);
  }
  if (verbose) {
    args.push('-v');
  }
  if (uploaderVersion == '') {
    uploaderVersion = 'latest';
  }
  return {args, failCi, os, verbose, uploaderVersion};
};

const buildReportExec = () => {
  const overrideCommit = core.getInput('override_commit');
  const slug = core.getInput('slug');
  const token = core.getInput('token');


  const reportCommand = 'create-report';
  const reportExecArgs = [];

  const reportOptions:any = {};
  reportOptions.env = Object.assign(process.env, {
    GITHUB_ACTION: process.env.GITHUB_ACTION,
    GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
    GITHUB_REF: process.env.GITHUB_REF,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_SHA: process.env.GITHUB_SHA,
    GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF || '',
  });


  if (token) {
    reportOptions.env.CODECOV_TOKEN = token;
  }
  if (overrideCommit) {
    reportExecArgs.push('-C', `${overrideCommit}`);
  } else if (
    `${context.eventName}` == 'pull_request' ||
    `${context.eventName}` == 'pull_request_target'
  ) {
    reportExecArgs.push('-C', `${context.payload.pull_request.head.sha}`);
  }
  if (slug) {
    reportExecArgs.push('--slug', `${slug}`);
  }

  return {reportExecArgs, reportOptions, reportCommand};
};

const buildStaticAnalysisExec = () => {
  const filePattern = core.getInput('file_pattern');
  const foldersToExclude = core.getInput('folders_to_exclude');
  const force = core.getInput('force');
  const overrideCommit = core.getInput('override_commit');
  const staticToken = core.getInput('static_token');

  const staticAnalysisCommand = 'static-analysis';
  const staticAnalysisExecArgs = [];

  const staticAnalysisOptions:any = {};
  staticAnalysisOptions.env = Object.assign(process.env, {
    GITHUB_ACTION: process.env.GITHUB_ACTION,
    GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
    GITHUB_REF: process.env.GITHUB_REF,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_SHA: process.env.GITHUB_SHA,
    GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF || '',
  });

  if (staticToken) {
    staticAnalysisOptions.env.CODECOV_STATIC_TOKEN = staticToken;
  }
  if (filePattern) {
    staticAnalysisExecArgs.push('--pattern', `${filePattern}`);
  }
  if (foldersToExclude) {
    staticAnalysisExecArgs.push('--folders-to-exclude', `${foldersToExclude}`);
  }
  if (force) {
    staticAnalysisExecArgs.push('--force');
  }
  if (overrideCommit) {
    staticAnalysisExecArgs.push('-C', `${overrideCommit}`);
  } else if (
    `${context.eventName}` == 'pull_request' ||
    `${context.eventName}` == 'pull_request_target'
  ) {
    staticAnalysisExecArgs.push(
        '--commit-sha',
        `${context.payload.pull_request.head.sha}`,
    );
  }

  return {staticAnalysisExecArgs, staticAnalysisOptions, staticAnalysisCommand};
};

const buildLabelAnalysisExec = async () => {
  const overrideCommit = core.getInput('override_commit');
  const overrideBaseCommit = core.getInput('override_base_commit');
  const maxWaitTime = core.getInput('max_wait_time');
  const testOutputPath = core.getInput('test_output_path');
  const staticToken = core.getInput('static_token');

  const labelAnalysisCommand = 'label-analysis';
  const labelAnalysisExecArgs = ['--dry-run'];

  const labelAnalysisOptions:any = {};
  labelAnalysisOptions.env = Object.assign(process.env, {
    GITHUB_ACTION: process.env.GITHUB_ACTION,
    GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
    GITHUB_REF: process.env.GITHUB_REF,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_SHA: process.env.GITHUB_SHA,
    GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF || '',
  });

  if (staticToken) {
    labelAnalysisOptions.env.CODECOV_STATIC_TOKEN = staticToken;
  }
  if (overrideCommit) {
    labelAnalysisExecArgs.push('-C', `${overrideCommit}`);
  } else if (
    `${context.eventName}` == 'pull_request' ||
    `${context.eventName}` == 'pull_request_target'
  ) {
    labelAnalysisExecArgs.push(
        '--head-sha',
        `${context.payload.pull_request.head.sha}`,
    );
  }
  if (overrideBaseCommit) {
    labelAnalysisOptions.baseCommits = [overrideBaseCommit];
  } else {
    const parentCommit = await getParentCommit();
    const prBaseCommit = getPRBaseCommit();
    labelAnalysisOptions.baseCommits = [parentCommit, prBaseCommit];
  }
  if (maxWaitTime) {
    labelAnalysisExecArgs.push('--max-wait-time', `${maxWaitTime}`);
  }
  if (testOutputPath) {
    labelAnalysisOptions.testOutputPath = testOutputPath;
  } else {
    labelAnalysisOptions.testOutputPath = 'tmp-codecov-labels';
  }

  return {labelAnalysisExecArgs, labelAnalysisOptions, labelAnalysisCommand};
};


export {
  buildCommitExec,
  buildGeneralExec,
  buildLabelAnalysisExec,
  buildReportExec,
  buildStaticAnalysisExec,
};