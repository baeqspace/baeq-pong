import { useContext } from "react"
import { IntlContext } from "../contexts/IntlContext"

export function AdminItem({text, deleteFunc, itemId, ...rest}) {
    const [locale] = useContext(IntlContext)

    return (
        <div className="admin-item relative flex justify-between items-center mt-5 mx-auto h-12 w-96 pl-3 rounded-xl" {...rest}>
            <p className="admin-item-text inline-block w-full">{text}</p>
            <button onClick={() => deleteFunc(itemId)} className="bg-red-500 h-full text-white w-28 rounded-r-xl">{locale.adminDelete}</button>
        </div>
    )
}