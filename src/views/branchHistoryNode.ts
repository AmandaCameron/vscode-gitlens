'use strict';
import { Iterables } from '../system';
import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { CommitNode } from './commitNode';
import { GlyphChars } from '../constants';
import { ExplorerNode, ResourceType, ShowAllCommitsNode } from './explorerNode';
import { GitBranch, GitService, GitUri } from '../gitService';

export class BranchHistoryNode extends ExplorerNode {

        readonly resourceType: ResourceType = 'gitlens:branch-history';

        maxCount: number | undefined = undefined;

        constructor(public readonly branch: GitBranch, uri: GitUri, private readonly template: string, protected readonly context: ExtensionContext, protected readonly git: GitService) {
            super(uri);
        }

        async getChildren(): Promise<ExplorerNode[]> {
            const log = await this.git.getLogForRepo(this.uri.repoPath!, this.branch.name, this.maxCount);
            if (log === undefined) return [];

            const children = Iterables.map(log.commits.values(), c => new CommitNode(c, this.template, this.context, this.git, this.branch));
            if (!log.truncated) return [...children];

            return [...children, new ShowAllCommitsNode(this, this.context)];
        }

        async getTreeItem(): Promise<TreeItem> {
            let name = this.branch.getName();
            if (!this.branch.remote && this.branch.tracking !== undefined && this.git.config.gitExplorer.showTrackingBranch) {
                name += ` ${GlyphChars.Space}${GlyphChars.ArrowLeftRight}${GlyphChars.Space} ${this.branch.tracking}`;
            }
            const item = new TreeItem(`${this.branch!.current ? `${GlyphChars.Check} ${GlyphChars.Space}` : ''}${name}`, TreeItemCollapsibleState.Collapsed);
            item.contextValue = this.branch.tracking ? `${this.resourceType}:remote` : this.resourceType;

            item.iconPath = {
                dark: this.context.asAbsolutePath('images/dark/icon-branch.svg'),
                light: this.context.asAbsolutePath('images/light/icon-branch.svg')
            };

            return item;
        }
    }
