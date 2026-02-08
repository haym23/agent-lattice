import { Link } from "react-router-dom";

interface PageShellProps {
	title: string;
	description: string;
}

/**
 * Executes page shell.
 */
export function PageShell({ title, description }: PageShellProps): JSX.Element {
	return (
		<>
			<nav className="nav" aria-label="Primary">
				<Link to="/">Dashboard</Link>
				<Link to="/editor">Editor</Link>
				<Link to="/templates">Templates</Link>
				<Link to="/settings">Settings</Link>
			</nav>
			<section className="card">
				<h1>{title}</h1>
				<p>{description}</p>
			</section>
		</>
	);
}
