import { readFileSync } from "fs";
import handlebars from "handlebars";
import { join } from "path";

export default function getHTMLTemplate(name: string, context: Record<string, string>): string {
    const templatePath = join(__dirname, 'templates', `${name}.hbs`);
    const templateString = readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateString);
    const htmlBody = compiledTemplate(context);

    return htmlBody;
}
