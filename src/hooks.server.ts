import chalk from "chalk";

export function handleError({ error }): void {
	console.log(chalk.red((error as Error).stack ?? error));
}
