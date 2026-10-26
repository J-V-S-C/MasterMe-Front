import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { Window } from 'happy-dom'
import { StyledSelect } from '../../components/styled-select'

beforeEach(() => { const window = new Window(); Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, Node: window.Node, PointerEvent: window.PointerEvent }) })
afterEach(() => cleanup())

const options = [{ value: 'a', label: 'Arquitetura' }, { value: 'b', label: 'Banco de dados' }]

describe('StyledSelect', () => {
  test('exposes a label and state and allows choosing an option', () => {
    const onValueChange = mock(() => {})
    const view = render(<StyledSelect label="Conceito" value="a" options={options} onValueChange={onValueChange} />)
    const trigger = view.getByRole('combobox', { name: 'Conceito' })
    expect(trigger.textContent).toContain('Arquitetura')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(view.getByRole('listbox', { name: 'Conceito' })).toBeTruthy()
    fireEvent.click(view.getByRole('option', { name: 'Banco de dados' }))
    expect(onValueChange).toHaveBeenCalledWith('b')
  })

  test('opens and selects with keyboard', () => {
    const onValueChange = mock(() => {})
    const view = render(<StyledSelect label="Material" value="a" options={options} onValueChange={onValueChange} />)
    const trigger = view.getByRole('combobox')
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledWith('b')
  })
})
