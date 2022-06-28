import { describe, expect, it } from 'vitest';
import EstimationsComponent from './EstimationsComponent.svelte';
import { render } from '@testing-library/svelte';
import { Story } from './model/story';
describe('Estimations', () => {
	const stories: Story[] = [new Story('1', 'Story 1'), new Story('2', 'Story 2')];

	it('Should show the stories to be estimated', async () => {
		const { getByText } = render(EstimationsComponent, { stories: stories });

		expect(() => getByText(/Story 1/)).not.toThrow();
		expect(() => getByText(/Story 2/)).not.toThrow();
		expect(() => getByText(/Story 3/)).toThrow();
	});
});
