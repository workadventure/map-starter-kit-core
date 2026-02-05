import express from 'express';
import * as fs from "node:fs";
import * as path from "node:path";
import Mustache from 'mustache';
import { getCoreRoot } from '../utils/getCoreRoot.ts';

const DEFAULT_META_TITLE = 'WorkAdventure Starter Kit';
const DEFAULT_PAGE_TITLE = 'WorkAdventure build your map';
const SELF_HOSTED_META_TITLE = 'WorkAdventure Starter Kit - Self-hosted';

export class FrontController {
    private app: express.Application;
    private headScriptsCache = new Map<string, string>();

    constructor(app: express.Application) {
        this.app = app;
        // Assets are now configured in app.ts
        this.setupRoutes();
        this.setupRoutesStep1();
        this.setupRoutesStep2();
        this.setupRoutesStep3();
        this.setupRoutesStep4();
    }

    private setupRoutes() {
        // Route for the Mustache renderer on "/"
        this.app.get('/', async (_, res) => {
            try {
                const headScripts = await this.loadHeadScripts('index');
                const isPublishingConfigured = await this.isPublishingConfigured();
                const secretConfig = await this.getSecretConfig();
                res.send(await this.renderTemplate('index', {
                    ...this.buildHeadData({ headScripts }),
                    isPublishingConfigured,
                    mapStorageUrl: secretConfig?.mapStorageUrl ?? '',
                }));
            } catch (error) {
                console.error('Error rendering template:', error);
                res.status(500).send('Error rendering template');
            }
        });
    }

    /**
     * Render a template file
     * @param filename - The filename of the template to render
     * @returns The rendered template
     */
    private async renderTemplate(filename: string, data: Record<string, unknown> = {}): Promise<string> {
        const coreRoot = getCoreRoot();
        const templatesDir = path.join(coreRoot, 'public/assets/views');
        if(!fs.existsSync(templatesDir)) {
            throw new Error(`Templates directory not found: ${templatesDir}`);
        }
        const templatePath = path.join(templatesDir, `${filename}.html`);
        const template = await fs.promises.readFile(templatePath, 'utf-8');
        const partialsDir = path.join(templatesDir, 'partials');
        const partials: Record<string, string> = {};
        if (fs.existsSync(partialsDir)) {
            const partialFiles = await fs.promises.readdir(partialsDir);
            for (const file of partialFiles) {
                if (!file.endsWith('.html')) {
                    continue;
                }
                const partialName = path.basename(file, '.html');
                const partialPath = path.join(partialsDir, file);
                partials[partialName] = await fs.promises.readFile(partialPath, 'utf-8');
            }
        }
        // Render the template with Mustache (without data for now)
        return Mustache.render(template, data, partials);
    }

    private buildHeadData(options: { metaTitle?: string; pageTitle?: string; headScripts?: string } = {}) {
        return {
            metaTitle: options.metaTitle ?? DEFAULT_META_TITLE,
            pageTitle: options.pageTitle ?? DEFAULT_PAGE_TITLE,
            headScripts: options.headScripts ?? '',
        };
    }

    private async loadHeadScripts(name?: string): Promise<string> {
        if (!name) {
            return '';
        }
        const cached = this.headScriptsCache.get(name);
        if (cached !== undefined) {
            return cached;
        }
        const coreRoot = getCoreRoot();
        const scriptPath = path.join(coreRoot, 'public/assets/views/partials/head-scripts', `${name}.html`);
        if (!fs.existsSync(scriptPath)) {
            this.headScriptsCache.set(name, '');
            return '';
        }
        const script = await fs.promises.readFile(scriptPath, 'utf-8');
        this.headScriptsCache.set(name, script);
        return script;
    }

    private async getSecretConfig(): Promise<{
        mapStorageUrl: string | null;
        mapStorageApiKey: string | null;
        uploadDirectory: string | null;
    } | null> {
        const envSecretPath = path.join(process.cwd(), '.env.secret');
        const hasSecretFile = await fs.promises.access(envSecretPath)
            .then(() => true)
            .catch(() => false);
        if (!hasSecretFile) {
            return null;
        }
        const secretContent = await fs.promises.readFile(envSecretPath, 'utf-8');
        const mapStorageUrl = secretContent.match(/MAP_STORAGE_URL=(.+)/)?.[1]?.trim() || null;
        const mapStorageApiKey = secretContent.match(/MAP_STORAGE_API_KEY=(.+)/)?.[1]?.trim() || null;
        const uploadDirectory = secretContent.match(/UPLOAD_DIRECTORY=(.+)/)?.[1]?.trim() || null;
        return {
            mapStorageUrl,
            mapStorageApiKey,
            uploadDirectory,
        };
    }

    private async isPublishingConfigured(): Promise<boolean> {
        const secretConfig = await this.getSecretConfig();
        return Boolean(
            secretConfig?.mapStorageUrl
            && secretConfig?.mapStorageApiKey
            && secretConfig?.uploadDirectory
        );
    }

    /**
     * Setup the routes for file "step1-git.html"
     * @returns void
     */
    private setupRoutesStep1() {
        this.app.get('/step1-git', async (_, res) => {
            const headScripts = await this.loadHeadScripts('background-fade');
            res.send(await this.renderTemplate('step1-git', this.buildHeadData({ headScripts })));
        });
    }

    /**
     * Setup the routes for file "step2-hosting.html"
     * @returns void
     */
    private setupRoutesStep2() {
        this.app.get('/step2-hosting', async (_, res) => {
            res.send(await this.renderTemplate('step2-hosting', this.buildHeadData()));
        });
    }

    /**
     * Setup the routes for file "step3-steps.html"
     * @returns void
     */
    private setupRoutesStep3() {
        this.app.get('/step3-steps', async (_, res) => {
            const headScripts = await this.loadHeadScripts('background-fade');
            const secretConfig = await this.getSecretConfig();
            res.send(await this.renderTemplate('step3-steps', {
                ...this.buildHeadData({ headScripts }),
                mapStorageUrl: secretConfig?.mapStorageUrl ?? '',
                mapStorageApiKey: secretConfig?.mapStorageApiKey ?? '',
                uploadDirectory: secretConfig?.uploadDirectory ?? '',
            }));
        });
        this.app.get('/step3-steps-selfhosted', async (_, res) => {
            const headScripts = await this.loadHeadScripts('background-fade-selfhosted');
            const secretConfig = await this.getSecretConfig();
            res.send(await this.renderTemplate('step3-steps-selfhosted', {
                ...this.buildHeadData({
                metaTitle: SELF_HOSTED_META_TITLE,
                pageTitle: 'WorkAdventure test map - Self-hosted',
                headScripts,
                }),
                mapStorageUrl: secretConfig?.mapStorageUrl ?? '',
                mapStorageApiKey: secretConfig?.mapStorageApiKey ?? '',
                uploadDirectory: secretConfig?.uploadDirectory ?? '',
            }));
        });
    }

    /**
     * Setup the routes for file "step4-map.html"
     * @returns void
     */
    private setupRoutesStep4() {
        this.app.get('/step4-validated', async (_, res) => {
            const headScripts = await this.loadHeadScripts('background-fade');
            res.send(await this.renderTemplate('step4-validated', this.buildHeadData({ headScripts })));
        });
        this.app.get('/step4-validated-selfhosted', async (_, res) => {
            const headScripts = await this.loadHeadScripts('selfhosted-maps');
            res.send(await this.renderTemplate('step4-validated-selfhosted', this.buildHeadData({
                metaTitle: SELF_HOSTED_META_TITLE,
                pageTitle: 'Your maps - Self-hosted',
                headScripts,
            })));
        });
    }
    
}
