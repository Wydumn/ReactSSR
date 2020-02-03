import axios from 'axios'

export const getHomeList = () => {
    return () => {
        axios.get('').then(
            (res) => {
            console.log(res)
        })
    }
}