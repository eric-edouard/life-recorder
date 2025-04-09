Legend-State v3 is a high-performance state management library that provides fine-grained reactivity and automatic persistence. Here's how to use it effectively:

###  Basic Usage

Create observables and manage state with simple getters and setters:

```typescript
import { observable } from "@legendapp/state"

// Create an observable object
const settings$ = observable({ 
    theme: 'dark',
    user: { name: 'John' }
})

// Get raw data
console.log(settings$.theme.get()) // 'dark'

// Get raw data without re-rendering on update
console.log(settings$.theme.peek()) // 'dark'

// Update data
settings$.theme.set('light')


```

###  React Integration



 `use$` hook:
```typescript
import { use$ } from "@legendapp/state/react"


function ThemeDisplay() {
    const theme = use$(settings$.theme)
    
    return <div>Current theme: {theme}</div>
}
```



###  Computed Observables

Create derived state that automatically updates:

```typescript
import { observable, observe } from "@legendapp/state"

const isDark$ = observable(() => 
    settings$.theme.get() === 'dark'
)

observe(() => {
    console.log(`Theme status: ${isDark$.get()}`)
})
```

###  Fine-grained Updates

Optimize performance with minimal re-renders:

```typescript
import { useObservable, Memo } from "@legendapp/state/react"


function Counter() {
    const count$ = useObservable(0)
    
    // Only updates the Memo component
    return (
        <div>
            Count: <Memo>{count$}</Memo>
            <button onClick={() => count$.set(c => c + 1)}>
                Increment
            </button>
        </div>
    )
}
```


###  Best Practices

1. Keep observables focused and granular
2. Use computed observables for derived state
3. Implement persistence early in development
4. Use `Memo` component for fine-grained updates
5. Structure state logically for better sync performance
