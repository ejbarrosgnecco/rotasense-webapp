import { toast } from "react-hot-toast"

type ToastTypes =
    | "ui"
    | "good"
    | "bad"

interface ToastProps {
    type: ToastTypes,
    promise?: boolean,
    text: string
}

const toastNotification = ({ type, promise, text }: ToastProps ) => {
    switch (type) {
        case "ui":
            return toast.success(text);

        case "bad":
            return toast.error(text)
    }
}

export default toastNotification