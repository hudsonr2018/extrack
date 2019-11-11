import firebase from '../../config/Firebase'
import * as AxiosProduct from '../../service/Axios'

export const Types = {
  LOADING: 'auth/LOADING',
  LOGIN: 'auth/LOGIN',
  LOGOUT: 'auth/LOGOUT',
  USERINFO: 'auth/USERINFO',
  ERROR: 'auth/ERROR'
}

const INITIAL_STATE = {
  isLogged: false,
  isLoading: false,
  authUser: {},
  errorMessage: ''
}

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case Types.LOADING:
      return {
        ...state,
        isLoading: action.payload
      }
    case Types.LOGIN:
      return {
        ...state,
        isLogged: true,
        errorMessage: ''
      }
    case Types.USERINFO:
      return {
        ...state,
        authUser: action.payload,
        isLogged: true,
        errorMessage: ''
      }
    case Types.LOGOUT:
      return {
        ...state,
        isLogged: action.payload.isLogged,
        authUser: action.payload.authUser
      }
    case Types.ERROR:
      return {
        ...state,
        errorMessage: action.payload
      }
    default:
      return state
  }
}

export const Creators = {
  handleSignUp: (email, password, confirmPassword, firstName, userImage) => {
    return async dispatch => {
      const db = firebase.firestore()
      if (!email || !password || !confirmPassword || !firstName) {
        dispatch({
          type: Types.ERROR,
          payload: 'Please, fill in all required fields.'
        })
      } else if (password !== confirmPassword) {
        dispatch({
          type: Types.ERROR,
          payload: 'Passwords need to be equal.'
        })
      } else {
        await firebase
          .auth()
          .createUserWithEmailAndPassword(email, password)
          .then(async user => {
            const userUid = user.user.uid
            const base64URL = await AxiosProduct.registerProfilePicture({
              userUid,
              userImage
            })

            db.collection('users')
              .doc('data')
              .collection('profile')
              .doc(user.user.uid)
              .set({
                name: firstName
              })
            dispatch({
              type: Types.USERINFO,
              payload: {
                userName: firstName,
                userEmail: email,
                userImage: base64URL
              }
            })
          })
          .catch(error => {
            if (error.code === 'auth/invalid-email')
              dispatch({
                type: Types.ERROR,
                payload: 'Invalid email address format.'
              })

            if (error.code === 'auth/email-already-in-use')
              dispatch({
                type: Types.ERROR,
                payload: 'This email is already in use.'
              })

            if (error.code === 'auth/weak-password')
              dispatch({
                type: Types.ERROR,
                payload: 'You need to use a strong password.'
              })

            if (error.code === 'auth/operation-not-allowed')
              dispatch({
                type: Types.ERROR,
                payload: "Create user with email isn't allowed."
              })
          })
      }
    }
  },

  handleLogin: (email, password) => {
    return async dispatch => {
      if (!email || !password) {
        dispatch({
          type: Types.ERROR,
          payload: 'Please, fill in all required fields.'
        })
      } else {
        await firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(async () => {
            await dispatch(Creators.handleUserInfo())
          })
          .then(
            async () =>
              await dispatch({
                type: Types.LOGIN,
                payload: true
              })
          )
          .catch(error => {
            if (error.code === 'auth/invalid-email')
              dispatch({
                type: Types.ERROR,
                payload: 'Invalid email address format.'
              })

            if (error.code === 'auth/user-not-found')
              dispatch({
                type: Types.ERROR,
                payload: "This account doesn't exist."
              })

            if (error.code === 'auth/wrong-password')
              dispatch({
                type: Types.ERROR,
                payload: 'Wrong password.'
              })

            if (error.code === 'auth/too-many-requests')
              dispatch({
                type: Types.ERROR,
                payload: 'You tried to login so many times, wait.'
              })
          })
      }
    }
  },

  handleForgotPassword: email => {
    return async dispatch => {
      if (!email) {
        dispatch({
          type: Types.ERROR,
          payload: 'Please, fill in all required fields.'
        })
      } else {
        await firebase
          .auth()
          .sendPasswordResetEmail(email)
          .catch(error => {
            if (error.code === 'auth/invalid-email')
              dispatch({
                type: Types.ERROR,
                payload: 'Invalid email address format.'
              })

            if (error.code === 'auth/user-not-found')
              dispatch({
                type: Types.ERROR,
                payload: "This account doesn't exist."
              })
          })
      }
    }
  },

  handleUpdateProfile: (
    userName,
    userGenre,
    userBirthDate,
    userEmail,
    userImage
  ) => {
    return async dispatch => {
      const db = firebase.firestore()

      if (!userName || !userGenre || !userBirthDate || !userEmail) {
        await dispatch({
          type: Types.ERROR,
          payload: 'Please, fill in all required fields.'
        })
      } else {
        const user = firebase.auth().currentUser
        if (user) {
          const userUid = user.uid
          const base64URL = await AxiosProduct.updateProfilePicture({
            userUid,
            userImage
          })

          await user
            .updateEmail(userEmail)
            .then(async () => {
              await db
                .collection('users')
                .doc('data')
                .collection('profile')
                .doc(user.uid)
                .set({
                  name: userName,
                  gender: userGenre,
                  birthDate: userBirthDate
                })
            })
            .then(async () => {
              await dispatch({
                type: Types.USERINFO,
                payload: {
                  userName,
                  userGenre,
                  userBirthDate,
                  userEmail,
                  userUid,
                  userImage: base64URL
                }
              })
            })
            .catch(error => {
              if (error.code === 'auth/invalid-email')
                dispatch({
                  type: Types.ERROR,
                  payload: 'Invalid email address format.'
                })

              if (error.code === 'auth/email-already-in-use')
                dispatch({
                  type: Types.ERROR,
                  payload: 'This email is already in use.'
                })
            })
        }
      }
    }
  },

  handleUserInfo: () => {
    return async dispatch => {
      const user = firebase.auth().currentUser
      if (user) {
        //Pegando imagem do usuário
        const allUsersImage = await AxiosProduct.getProfilePicture()
        const userImage = allUsersImage.filter(
          base64 => base64.userUid === user.uid
        )[0].userImage

        const db = firebase.firestore()
        const docRef = db
          .collection('users')
          .doc('data')
          .collection('profile')
          .doc(`${user.uid}`)
        docRef
          .get()
          .then(async doc => {
            if (doc.exists) {
              const userName = await doc.data().name
              const gender = await doc.data().gender
              const birthDate = await doc.data().birthDate
              dispatch({
                type: Types.USERINFO,
                payload: {
                  userName: userName,
                  userGenre: gender,
                  userBirthDate: birthDate,
                  userEmail: user.email,
                  userUid: user.uid,
                  userImage: userImage
                }
              })
            } else {
              console.log('No such document!')
            }
          })
          .catch(function(error) {
            console.log('Error getting document:', error)
          })
      } else {
        console.log('User not logged in')
      }
    }
  },

  handleLogout: () => {
    return async dispatch => {
      try {
        await firebase
          .auth()
          .signOut()
          .then(() =>
            dispatch({
              type: Types.LOGOUT,
              payload: {
                isLogged: false,
                authUser: {}
              }
            })
          )
          .catch(error => {
            console.error(error)
          })
      } catch (err) {
        console.log(err)
      }
    }
  },

  handleLoader: status => {
    return async dispatch => {
      dispatch({
        type: Types.LOADING,
        payload: status
      })
    }
  }
}
