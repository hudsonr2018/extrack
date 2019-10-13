import React, { Component, Fragment } from 'react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { Creators as ProductActions } from '../../store/ducks/product'

import { productSuccess, productError } from '../../utils/SweetAlert'

import {
  StyledContainer,
  Title,
  Form,
  ProfileInfo,
  ProductSelect,
  GoToProfile,
  RegisterProduct
} from './styled'

class ProductForm extends Component {
  state = {
    userUid: this.props.authUser.userUid,
    userBirthDate: this.props.authUser.userBirthDate || '',
    userGenre: this.props.authUser.userGenre || '',
    pName: '',
    pCategory: 'default',
    pQuantity: '',
    pPrice: '',
    createdAt: '',
    updatedAt: ''
  }

  submitProduct = async e => {
    e.preventDefault()

    const {
      userUid,
      userBirthDate,
      userGenre,
      pName,
      pCategory,
      pQuantity,
      pPrice
    } = this.state

    const { submitUserProduct } = this.props

    if (pName && pCategory !== 'default' && pQuantity && pPrice) {
      await submitUserProduct({
        userUid,
        userBirthDate,
        userGenre,
        pName,
        pCategory,
        pQuantity,
        pPrice,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      productSuccess()

      this.setState({
        pName: '',
        pCategory: 'default',
        pQuantity: '',
        pPrice: ''
      })
    } else {
      productError()
    }
  }

  handleGenreChange(e) {
    this.setState({ pCategory: e.target.value })
  }

  render() {
    const { pName, pCategory, pQuantity, pPrice } = this.state
    const {
      authUser: { userGenre, userBirthDate }
    } = this.props

    return (
      <StyledContainer>
        {!userGenre && !userBirthDate ? (
          <Fragment>
            <Title>
              You can't insert products yet. Please complete your profile.
            </Title>
            <GoToProfile>
              <Link to='/profile'>Go to profile</Link>
            </GoToProfile>
          </Fragment>
        ) : (
          <Fragment>
            <Title>Fill all informations to register your products:</Title>
            <Form onSubmit={this.submitProduct}>
              <ProfileInfo
                placeholder='Name*'
                type='text'
                value={pName}
                onChange={e => this.setState({ pName: e.target.value })}
              />

              <ProductSelect
                value={pCategory}
                onChange={e => this.handleGenreChange(e)}
              >
                <option value='default' disabled>
                  Select the category*
                </option>
                <option value='Food'>Food</option>
                <option value='House'>House</option>
                <option value='Vehicle'>Vehicle</option>
                <option value='Health'>Health</option>
                <option value='Beauty'>Beauty</option>
                <option value='Personal'>Personal</option>
              </ProductSelect>

              <ProfileInfo
                placeholder='Quantity*'
                value={pQuantity}
                type='number'
                min='1'
                step='1'
                onChange={e => this.setState({ pQuantity: e.target.value })}
              />

              <ProfileInfo
                placeholder='Price*'
                value={pPrice}
                type='number'
                min='1'
                step='.01'
                onChange={e => this.setState({ pPrice: e.target.value })}
              />

              <RegisterProduct type='submit'>+</RegisterProduct>
            </Form>
          </Fragment>
        )}
      </StyledContainer>
    )
  }
}

const mapStateToProps = state => ({
  authUser: state.auth.authUser,
  userProducts: state.product.userProducts
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(ProductActions, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProductForm)