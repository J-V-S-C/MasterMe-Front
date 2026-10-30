import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { Window } from 'happy-dom'
import { SelectField } from '../../components/ui/select-field'

beforeEach(() => { const window = new Window(); Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, Node: window.Node }) })
afterEach(() => cleanup())

const options = [{ value: 'a', label: 'Arquitetura' }, { value: 'b', label: 'Banco de dados' }]

describe('SelectField', () => {
  test('uses a labeled native select and reports the selected value', () => {
    const onValueChange = mock(() => {})
    const view = render(<SelectField label="Conceito" value="a" options={options} onValueChange={onValueChange} />)
    const select = view.getByRole('combobox', { name: 'Conceito' }) as HTMLSelectElement
    expect(select.tagName).toBe('SELECT')
    expect(select.value).toBe('a')
    fireEvent.change(select, { target: { value: 'b' } })
    expect(onValueChange).toHaveBeenCalledWith('b')
  })

  test('cannot be opened before choices are available', () => {
    const view = render(<SelectField label="Material" value="" options={[]} onValueChange={() => {}} />)
    const select = view.getByRole('combobox', { name: 'Material' }) as HTMLSelectElement
    expect(select.disabled).toBe(true)
    expect(select.options.length).toBe(1)
  })
})
