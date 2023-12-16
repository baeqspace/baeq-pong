export function Button({children, ...props}) {
    return (
        <button {...props} className="button-ui">
            {children}
        </button>
    )
}